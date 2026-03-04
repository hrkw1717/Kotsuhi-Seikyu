import os
import datetime
import json
import gspread
import pandas as pd
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

def check_shift_consistency():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(base_dir, ".env"))
    load_dotenv(os.path.join(base_dir, "..", ".env"))

    SPREADSHEET_URL = os.getenv("SPREADSHEET_URL") or "https://docs.google.com/spreadsheets/d/1WrPey4LrG4ihA8eTtMF-rm340_TyFjWclSaw7o-OAuc/edit"
    creds_json = os.getenv("GCP_SERVICE_ACCOUNT_JSON", "").strip("'\"")

    if not creds_json:
        print("Error: GCP_SERVICE_ACCOUNT_JSON not found")
        return

    creds_dict = json.loads(creds_json)
    creds = Credentials.from_service_account_info(
        creds_dict,
        scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    client = gspread.authorize(creds)

    sh = client.open_by_url(SPREADSHEET_URL)
    worksheet = sh.worksheet("シフト表")
    all_data = worksheet.get_all_records()
    df = pd.DataFrame(all_data)

    df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
    df["Month"] = pd.to_numeric(df["Month"], errors="coerce")

    staff_order = ["山口", "堀川", "坂下"]
    errors = []

    start_date = datetime.date(2025, 11, 1)
    end_date   = datetime.date(2026, 12, 31)
    delta      = datetime.timedelta(days=1)

    last_staff_index = -1
    current_date = start_date

    while current_date <= end_date:
        y, m, d = current_date.year, current_date.month, current_date.day
        date_str = current_date.strftime("%Y-%m-%d")

        is_new_year = (m == 1 and d in [1, 2, 3])

        day_df = df[(df["Year"] == y) & (df["Month"] == m)]

        # --- 要件3: 存在しない日付にデータがあるのは不可 ---
        for invalid_day in range(28, 32):
            try:
                datetime.date(y, m, invalid_day)
            except ValueError:
                col_name = str(invalid_day)
                if col_name in df.columns:
                    for name in staff_order:
                        row = day_df[day_df["氏名"] == name]
                        if not row.empty:
                            v = str(row.iloc[0].get(col_name, "")).strip()
                            if v and v != "nan":
                                errors.append(
                                    f"[{y}/{m:02d}] 無効日付エラー: {invalid_day}日は存在しない日なのに '{v}' (氏名:{name}) が入っています"
                                )

        # --- その日の出勤者を取得 ---
        active_staff = []
        for name in staff_order:
            row = day_df[day_df["氏名"] == name]
            if not row.empty:
                val = str(row.iloc[0].get(str(d), "")).strip()
                if val in ["出", "朝", "夜"]:
                    active_staff.append((name, val))

        # --- 要件4: 三が日は2名まで / それ以外は1名のみ ---
        if is_new_year:
            if len(active_staff) > 2:
                errors.append(f"[{date_str}] 三が日重複エラー: 3名以上出勤しています ({[s[0] for s in active_staff]})")
        else:
            if len(active_staff) > 1:
                errors.append(f"[{date_str}] 重複エラー: 2名以上出勤しています ({[s[0] for s in active_staff]})")

        # --- 三が日以外の処理 ---
        if not is_new_year and len(active_staff) == 1:
            current_staff, current_val = active_staff[0]
            current_staff_index = staff_order.index(current_staff)

            # --- 要件1・7: 出勤順序 (三が日は順序トラッキング対象外) ---
            if current_date == start_date:
                if current_staff != "山口":
                    errors.append(f"[{date_str}] 開始者エラー: 山口から始まるべきですが {current_staff} が出勤しています")
            elif last_staff_index != -1:
                expected_index = (last_staff_index + 1) % 3
                if current_staff_index != expected_index:
                    errors.append(
                        f"[{date_str}] 順序エラー: {staff_order[expected_index]} の番ですが {current_staff} が出勤しています"
                    )

            last_staff_index = current_staff_index  # 三が日以外のみ更新

            # --- 要件5: 三が日以外は「出」のみ使用可 (朝・夜は不可) ---
            if current_val in ["朝", "夜"]:
                errors.append(f"[{date_str}] 値エラー: 三が日以外では 朝/夜 は使用不可です ({current_staff}: '{current_val}')")

            # --- 要件6・9: 「出」の翌日に「明」が必要。ただし翌日が三が日(1/1～1/3)なら不要 ---
            if current_val == "出":
                next_date = current_date + delta
                is_next_new_year = (next_date.month == 1 and next_date.day in [1, 2, 3])
                # 翌日が三が日なら「明」不要
                if not is_next_new_year and next_date <= end_date:
                    ny, nm, nd_next = next_date.year, next_date.month, next_date.day
                    next_day_df = df[(df["Year"] == ny) & (df["Month"] == nm)]
                    next_row = next_day_df[next_day_df["氏名"] == current_staff]
                    if not next_row.empty:
                        next_val = str(next_row.iloc[0].get(str(nd_next), "")).strip()
                        if next_val != "明":
                            errors.append(
                                f"[{date_str}] 明欠落エラー: {current_staff} の翌日 ({next_date.strftime('%Y-%m-%d')}) に '明' がありません (現在: '{next_val}')"
                            )
                    else:
                        errors.append(
                            f"[{date_str}] 明データ不在エラー: {current_staff} の翌日データが見つかりません ({next_date.strftime('%Y-%m-%d')})"
                        )

        # --- 要件5: 三が日は「朝」「夜」のみ使用可 ---
        if is_new_year:
            for name, val in active_staff:
                if val not in ["朝", "夜"]:
                    errors.append(f"[{date_str}] 三が日形式エラー: {name} の状態が '{val}' です (朝/夜であるべき)")

        current_date += delta

    # --- シフト作成条件 (joken.txt または スプレッドシート) の読み込み ---
    joken_text = ""
    try:
        # スプレッドシートから取得を試みる
        # sh = client.open_by_url(SPREADSHEET_URL) # sh is already opened above
        try:
            ws_joken = sh.worksheet("シフトの条件")
            vals = ws_joken.get_all_values()
            joken_text = "\n".join([row[0] for row in vals if row])
            print("スプレッドシート「シフトの条件」からルールを読み込みました。")
        except gspread.exceptions.WorksheetNotFound:
            print("スプレッドシートに「シフトの条件」タブが見つかりませんでした。joken.txtを試行します。")
            # タブがない場合はファイルから
            if os.path.exists("joken.txt"):
                with open("joken.txt", "r", encoding="utf-8") as f:
                    joken_text = f.read()
                    print("joken.txt からルールを読み込みました。")
            else:
                print("joken.txt も見つかりませんでした。ルールは適用されません。")
        except Exception as e:
            print(f"スプレッドシート「シフトの条件」読み込みエラー: {e}。joken.txtを試行します。")
            if os.path.exists("joken.txt"):
                with open("joken.txt", "r", encoding="utf-8") as f:
                    joken_text = f.read()
                    print("joken.txt からルールを読み込みました。")
            else:
                print("joken.txt も見つかりませんでした。ルールは適用されません。")
    except Exception as e:
        print(f"ルール読み込みエラー: {e}")

    if joken_text:
        print("\n--- 現在の適用ルール ---")
        print(joken_text)
        print("------------------------\n")

    # --- 結果出力 ---
    result_lines = ["--- シフト精査結果 ---"]
    if not errors:
        result_lines.append("全要件をクリアしています。不整合なし。")
    else:
        result_lines.append(f"計 {len(errors)} 件の不整合が見つかりました:")
        for i, err in enumerate(errors, 1):
            result_lines.append(f"  {i}. {err}")

    return result_lines

if __name__ == "__main__":
    lines = check_shift_consistency()
    if lines:
        for line in lines:
            print(line)
