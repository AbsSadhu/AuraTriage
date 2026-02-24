import sqlite3

def init_database():
    conn = sqlite3.connect('mcp.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            abha_id TEXT PRIMARY KEY,
            name TEXT,
            dob TEXT,
            gender TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS op_consult_records (
            encounter_id TEXT PRIMARY KEY,
            abha_id TEXT,
            date TEXT,
            chief_complaint TEXT,
            hinglish_notes TEXT,
            FOREIGN KEY(abha_id) REFERENCES patients(abha_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medications (
            med_id TEXT PRIMARY KEY,
            encounter_id TEXT,
            drug_name TEXT,
            dosage TEXT,
            is_jan_aushadhi BOOLEAN,
            FOREIGN KEY(encounter_id) REFERENCES op_consult_records(encounter_id)
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_database()
