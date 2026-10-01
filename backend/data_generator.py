"""
Operation Abhedya-Chakra: High-Speed Synthetic Banking Ledger Generator
Generates realistic multi-bank transaction ledgers (2,000,000+ records) matching the 11 PS columns:
- 1,500 Ground-Truth Injected Mules (L1 Collector, L2 Distributor, L3 Terminal Cash-Out)
- 23,500 Benign Accounts (Payroll, Merchants, Retail P2P)
- 5 Pre-configured Test Victim Accounts for Blind Query Testing
"""

import os
import csv
import random
import time
import json
from datetime import datetime, timedelta

BANKS = [
    ("SBIN0001234", "State Bank of India"),
    ("HDFC0000567", "HDFC Bank"),
    ("ICIC0000890", "ICICI Bank"),
    ("UTIB0001122", "Axis Bank"),
    ("PUNB0003344", "Punjab National Bank"),
    ("BARB0005566", "Bank of Baroda"),
    ("KKBK0007788", "Kotak Mahindra Bank"),
    ("CBIN0009900", "Central Bank of India"),
    ("UBIO0002233", "Union Bank of India"),
    ("INDB0004455", "IndusInd Bank")
]

PAYMENT_MODES = ["UPI", "IMPS", "NEFT", "RTGS"]
DOMESTIC_IPS = ["103.21.244.", "49.36.128.", "157.34.88.", "14.139.240.", "27.56.120."]
FOREIGN_PROXY_IPS = ["185.220.101.", "194.165.16.", "185.193.125.", "194.67.210."]
BENIGN_DEVICES = ["Android", "iOS", "Windows_Browser"]
MULE_DEVICES = ["Web_Emulator", "Linux_Script"]

SCAM_NARRATIONS = [
    "P2P_BINANCE_USDT_SETTLE",
    "CRYPTO_USDT_TRX_CONVERT",
    "COMMISSION_CUT_TELEGRAM_VIP",
    "TASK_REFUND_WALLET_CASH",
    "USDT_P2P_TRADING_ORDER",
    "COMMISSION_SHARE_P2P",
    "P2P_INSTANT_USDT_INR"
]

BENIGN_NARRATIONS = [
    "UPI-Salary-Monthly",
    "UPI-Grocery-Kirana",
    "NEFT-Vendor-Invoice-Settlement",
    "IMPS-Rent-Transfer",
    "UPI-Electricity-Bill",
    "UPI-Dinner-Sharing",
    "NEFT-Corporate-Payroll",
    "IMPS-Medical-Pharmacy",
    "UPI-Petrol-Pump",
    "UPI-Mobile-Recharge"
]

def make_account(num: int) -> str:
    return f"{100000000000 + num}"

def random_timestamp(start_dt: datetime, end_dt: datetime) -> datetime:
    delta = end_dt - start_dt
    int_delta = int(delta.total_seconds())
    random_second = random.randint(0, int_delta)
    return start_dt + timedelta(seconds=random_second)

def generate_dataset(output_csv: str, total_records: int = 2000000):
    start_time = time.time()
    print(f"[DATA GEN] Starting synthetic generation of {total_records:,} banking records...")
    
    start_window = datetime(2026, 9, 15, 0, 0, 0)
    end_window = datetime(2026, 9, 30, 23, 59, 59)
    
    # 1. Accounts Pool
    victims = [make_account(i) for i in range(1000, 1100)]
    l1_collectors = [make_account(i) for i in range(2000, 2150)]
    l2_distributors = [make_account(i) for i in range(3000, 3600)]
    l3_terminals = [make_account(i) for i in range(4000, 4750)]
    benign_accounts = [make_account(i) for i in range(10000, 33500)]
    
    ground_truth = {
        "victims": victims,
        "l1_collectors": l1_collectors,
        "l2_distributors": l2_distributors,
        "l3_terminals": l3_terminals,
        "mule_count": len(l1_collectors) + len(l2_distributors) + len(l3_terminals),
        "benign_count": len(benign_accounts)
    }
    
    test_victims = victims[:5]
    rows = []
    tx_counter = 1
    
    print("[DATA GEN] Generating injected multi-tier money mule syndicates...")
    
    # 2. Inject Multi-Tier Mule Laundering Syndicates
    for v_idx, vic in enumerate(victims):
        victim_theft = round(random.uniform(250000.0, 1500000.0), 2)
        v_bank = random.choice(BANKS)[0]
        v_time = random_timestamp(start_window, end_window - timedelta(days=2))
        
        l1 = l1_collectors[v_idx % len(l1_collectors)]
        l1_bank = random.choice(BANKS)[0]
        
        tx_id_1 = f"TXN{tx_counter:09d}"
        tx_counter += 1
        rows.append([
            tx_id_1, vic, l1, v_bank, l1_bank, victim_theft,
            v_time.strftime("%Y-%m-%d %H:%M:%S"),
            random.choice(["UPI", "IMPS"]),
            "UPI-REFUND-REVERSE-CR",
            f"{random.choice(DOMESTIC_IPS)}{random.randint(2, 250)}",
            "Android"
        ])
        
        l1_disp_start = v_time + timedelta(minutes=random.randint(3, 10))
        num_l2 = random.randint(3, 7)
        slice_amount = round((victim_theft * 0.95) / num_l2, 2)
        
        assigned_l2s = random.sample(l2_distributors, num_l2)
        for l2 in assigned_l2s:
            l2_bank = random.choice(BANKS)[0]
            tx_time_2 = l1_disp_start + timedelta(seconds=random.randint(10, 300))
            tx_id_2 = f"TXN{tx_counter:09d}"
            tx_counter += 1
            rows.append([
                tx_id_2, l1, l2, l1_bank, l2_bank, slice_amount,
                tx_time_2.strftime("%Y-%m-%d %H:%M:%S"),
                "IMPS",
                "IMPS-URGENT-TRANSFER",
                f"{random.choice(FOREIGN_PROXY_IPS)}{random.randint(2, 250)}",
                random.choice(MULE_DEVICES)
            ])
            
            l3 = random.choice(l3_terminals)
            l3_bank = random.choice(BANKS)[0]
            tx_time_3 = tx_time_2 + timedelta(minutes=random.randint(5, 20))
            tx_id_3 = f"TXN{tx_counter:09d}"
            tx_counter += 1
            terminal_amount = round(slice_amount * 0.98, 2)
            rows.append([
                tx_id_3, l2, l3, l2_bank, l3_bank, terminal_amount,
                tx_time_3.strftime("%Y-%m-%d %H:%M:%S"),
                random.choice(["IMPS", "UPI"]),
                random.choice(SCAM_NARRATIONS),
                f"{random.choice(FOREIGN_PROXY_IPS)}{random.randint(2, 250)}",
                random.choice(MULE_DEVICES)
            ])
            
            if random.random() < 0.15:
                loop_partner = random.choice(l2_distributors)
                loop_time = tx_time_3 + timedelta(minutes=random.randint(15, 45))
                rows.append([
                    f"TXN{tx_counter:09d}", l3, loop_partner, l3_bank, random.choice(BANKS)[0],
                    round(terminal_amount * 0.5, 2),
                    loop_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "IMPS", "P2P_SETTLEMENT_LOOP",
                    f"{random.choice(FOREIGN_PROXY_IPS)}{random.randint(2, 250)}",
                    "Linux_Script"
                ])
                tx_counter += 1
    
    mule_rows_count = len(rows)
    print(f"[DATA GEN] Generated {mule_rows_count:,} ground-truth syndicate transactions.")
    
    remaining_records = total_records - mule_rows_count
    print(f"[DATA GEN] Synthesizing {remaining_records:,} benign banking transactions...")
    
    os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Transaction_ID", "Sender_Account", "Receiver_Account",
            "Sender_IFSC", "Receiver_IFSC", "Amount", "Timestamp",
            "Payment_Mode", "Narration", "IP_Address", "Device_Type"
        ])
        writer.writerows(rows)
        
        chunk_size = 50000
        generated_benign = 0
        
        while generated_benign < remaining_records:
            current_batch_size = min(chunk_size, remaining_records - generated_benign)
            chunk_rows = []
            
            for _ in range(current_batch_size):
                tx_id = f"TXN{tx_counter:09d}"
                tx_counter += 1
                
                s_acc = random.choice(benign_accounts)
                r_acc = random.choice(benign_accounts)
                while r_acc == s_acc:
                    r_acc = random.choice(benign_accounts)
                    
                s_bank = random.choice(BANKS)[0]
                r_bank = random.choice(BANKS)[0]
                amt = round(random.uniform(50.0, 45000.0), 2)
                t_stamp = random_timestamp(start_window, end_window)
                mode = random.choice(PAYMENT_MODES)
                narr = random.choice(BENIGN_NARRATIONS)
                ip = f"{random.choice(DOMESTIC_IPS)}{random.randint(2, 250)}"
                dev = random.choice(BENIGN_DEVICES)
                
                chunk_rows.append([
                    tx_id, s_acc, r_acc, s_bank, r_bank, amt,
                    t_stamp.strftime("%Y-%m-%d %H:%M:%S"),
                    mode, narr, ip, dev
                ])
                
            writer.writerows(chunk_rows)
            generated_benign += current_batch_size
            if generated_benign % 500000 == 0:
                print(f"[DATA GEN] Progress: {generated_benign + mule_rows_count:,} / {total_records:,} records...")

    gt_path = os.path.join(os.path.dirname(output_csv), "ground_truth_mules.json")
    with open(gt_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)
        
    test_victims_path = os.path.join(os.path.dirname(output_csv), "test_victims.json")
    with open(test_victims_path, "w", encoding="utf-8") as f:
        json.dump(test_victims, f, indent=2)
        
    elapsed = time.time() - start_time
    file_size_mb = os.path.getsize(output_csv) / (1024 * 1024)
    print(f"[DATA GEN COMPLETE] Generated {total_records:,} records in {elapsed:.2f}s! File size: {file_size_mb:.2f} MB")
    print(f"[DATA GEN] Ground truth saved to: {gt_path}")
    print(f"[DATA GEN] Test victims for Blind Query: {test_victims}")

if __name__ == "__main__":
    import sys
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "transactions_2m.csv")
    recs = 2000000
    if len(sys.argv) > 1:
        recs = int(sys.argv[1])
    generate_dataset(out, recs)
