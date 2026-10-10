import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  password_hash: string;
  role: 'admin' | 'user';
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  title: string;
  description: string;
  storage_path: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  is_password_protected: boolean;
  password_hash: string | null;
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface DownloadLog {
  id: string;
  user_id: string;
  user_email: string;
  file_id: string;
  file_title: string;
  downloaded_at: string;
  ip_address: string;
}

export interface DatabaseSchema {
  profiles: UserProfile[];
  files: FileRecord[];
  download_logs: DownloadLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
export const STORAGE_DIR = path.resolve(process.cwd(), 'storage/private_files');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

let inMemoryData: DatabaseSchema = {
  profiles: [],
  files: [],
  download_logs: [],
};

function saveDb(): void {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(inMemoryData, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

function loadDb(): void {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryData = JSON.parse(raw);
    } catch (err) {
      console.error('Error parsing db.json, initializing fresh db:', err);
      inMemoryData = { profiles: [], files: [], download_logs: [] };
    }
  } else {
    inMemoryData = { profiles: [], files: [], download_logs: [] };
  }
}

// Minimal valid PDF generator
function createSamplePdf(): Buffer {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 135 >>
stream
BT
/F1 22 Tf
50 720 Td
(DOCKWORLDWIDE ENTERPRISE SECURITY SPECIFICATION) Tj
/F1 12 Tf
0 -36 Td
(Official Protocol Verification Document - Version 4.2) Tj
0 -20 Td
(Confidential access granted to verified enterprise members.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000227 00000 n 
0000000414 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
485
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

// Minimal valid zip file generator (empty zip or zip with text file)
function createSampleZip(filename: string, contentStr: string): Buffer {
  const contentBuffer = Buffer.from(contentStr, 'utf-8');
  const nameBuffer = Buffer.from(filename, 'utf-8');

  // Local file header (30 bytes)
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // signature
  localHeader.writeUInt16LE(20, 4); // min version
  localHeader.writeUInt16LE(0, 6); // flags
  localHeader.writeUInt16LE(0, 8); // compression (none)
  localHeader.writeUInt16LE(0, 10); // mod time
  localHeader.writeUInt16LE(0, 12); // mod date
  // CRC-32 (simple calculation)
  let crc = 0 ^ (-1);
  for (let i = 0; i < contentBuffer.length; i++) {
    crc = (crc >>> 8) ^ [0, 0x77073096, 0xee0e612c, 0x990951ba][crc & 3]; // simplified crc
  }
  crc = (crc ^ (-1)) >>> 0;
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(contentBuffer.length, 18); // compressed size
  localHeader.writeUInt32LE(contentBuffer.length, 22); // uncompressed size
  localHeader.writeUInt16LE(nameBuffer.length, 26); // filename length
  localHeader.writeUInt16LE(0, 28); // extra field length

  // Central directory header (46 bytes)
  const cdHeader = Buffer.alloc(46);
  cdHeader.writeUInt32LE(0x02014b50, 0); // signature
  cdHeader.writeUInt16LE(20, 4); // version made by
  cdHeader.writeUInt16LE(20, 6); // version needed
  cdHeader.writeUInt16LE(0, 8); // flags
  cdHeader.writeUInt16LE(0, 10); // compression
  cdHeader.writeUInt16LE(0, 12); // mod time
  cdHeader.writeUInt16LE(0, 14); // mod date
  cdHeader.writeUInt32LE(crc, 16);
  cdHeader.writeUInt32LE(contentBuffer.length, 20);
  cdHeader.writeUInt32LE(contentBuffer.length, 24);
  cdHeader.writeUInt16LE(nameBuffer.length, 28);
  cdHeader.writeUInt16LE(0, 30); // extra length
  cdHeader.writeUInt16LE(0, 32); // comment length
  cdHeader.writeUInt16LE(0, 34); // disk start
  cdHeader.writeUInt16LE(0, 36); // internal attr
  cdHeader.writeUInt32LE(0, 38); // external attr
  cdHeader.writeUInt32LE(0, 42); // local header offset

  const cdOffset = localHeader.length + nameBuffer.length + contentBuffer.length;
  const cdSize = cdHeader.length + nameBuffer.length;

  // End of central directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk num
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(1, 8); // num entries on disk
  eocd.writeUInt16LE(1, 10); // total entries
  eocd.writeUInt32LE(cdSize, 12); // size of CD
  eocd.writeUInt32LE(cdOffset, 16); // offset of CD
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localHeader, nameBuffer, contentBuffer, cdHeader, nameBuffer, eocd]);
}

function initializeDatabase(): void {
  loadDb();

  // 1. Initialize Admin user with exact required credentials:
  // Username: DOCKWORLDWIDE, Password: 8408920173
  const adminExists = inMemoryData.profiles.some(
    (p) => p.email.toLowerCase() === 'dockworldwide' || p.username?.toLowerCase() === 'dockworldwide'
  );

  if (!adminExists) {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync('8408920173', salt);
    const adminUser: UserProfile = {
      id: 'admin_dockworldwide_001',
      email: 'DOCKWORLDWIDE',
      username: 'DOCKWORLDWIDE',
      password_hash,
      role: 'admin',
      approval_status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryData.profiles.unshift(adminUser);
    console.log('Admin account initialized: Username: DOCKWORLDWIDE');
  }

  // 2. Initialize Seed Files if none exist
  if (inMemoryData.files.length === 0) {
    try {
      // Seed File 1: Public PDF (no password)
      const pdfStoragePath = 'seed-dock-spec-v4.pdf';
      const pdfFullPath = path.join(STORAGE_DIR, pdfStoragePath);
      if (!fs.existsSync(pdfFullPath)) {
        fs.writeFileSync(pdfFullPath, createSamplePdf());
      }
      const pdfStat = fs.statSync(pdfFullPath);

      inMemoryData.files.push({
        id: 'file_spec_001',
        title: 'DOCKWORLDWIDE Global Security Architecture v4.2',
        description: 'Comprehensive technical whitepaper on encrypted transit protocols, node infrastructure, and compliance guidelines.',
        storage_path: pdfStoragePath,
        original_filename: 'DOCK-Security-Architecture-v4.2.pdf',
        file_type: 'application/pdf',
        file_size: pdfStat.size,
        is_password_protected: false,
        password_hash: null,
        is_active: true,
        download_count: 14,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      });

      // Seed File 2: Protected ZIP (Password: DockPortal2026!)
      const zipStoragePath = 'seed-enterprise-sdk.zip';
      const zipFullPath = path.join(STORAGE_DIR, zipStoragePath);
      if (!fs.existsSync(zipFullPath)) {
        fs.writeFileSync(
          zipFullPath,
          createSampleZip('README.txt', 'DOCKWORLDWIDE Enterprise SDK v2.8\nRelease Date: 2026\nConfidential SDK Bundle.')
        );
      }
      const zipStat = fs.statSync(zipFullPath);
      const zipPassHash = bcrypt.hashSync('DockPortal2026!', 10);

      inMemoryData.files.push({
        id: 'file_sdk_002',
        title: 'Enterprise Integration Client SDK & Keys (Bundle)',
        description: 'Restricted release bundle containing SDK client bindings, SSL root certificates, and setup utilities. Password protected.',
        storage_path: zipStoragePath,
        original_filename: 'DOCK-Enterprise-SDK-Release-v2.8.zip',
        file_type: 'application/zip',
        file_size: zipStat.size,
        is_password_protected: true,
        password_hash: zipPassHash,
        is_active: true,
        download_count: 7,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      });

      // Seed File 3: Public CSV dataset
      const csvStoragePath = 'seed-logistics-dataset.csv';
      const csvFullPath = path.join(STORAGE_DIR, csvStoragePath);
      if (!fs.existsSync(csvFullPath)) {
        const csvContent = `NodeID,RegionCode,BandwidthGbps,Status,LatencyMs\nAP-01,ASIA-EAST,100,ACTIVE,12\nEU-04,EU-CENTRAL,100,ACTIVE,18\nUS-02,US-EAST,250,ACTIVE,8\nUS-09,US-WEST,200,ACTIVE,14\n`;
        fs.writeFileSync(csvFullPath, Buffer.from(csvContent, 'utf-8'));
      }
      const csvStat = fs.statSync(csvFullPath);

      inMemoryData.files.push({
        id: 'file_nodes_003',
        title: 'Global High-Speed Relay Nodes Directory 2026',
        description: 'Real-time telemetry and edge endpoint configuration catalog for verified high-throughput logistics mirrors.',
        storage_path: csvStoragePath,
        original_filename: 'Global-Nodes-Catalog-2026.csv',
        file_type: 'text/csv',
        file_size: csvStat.size,
        is_password_protected: false,
        password_hash: null,
        is_active: true,
        download_count: 29,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      });

      // Seed File 4: Protected archive (Password: SecretPass77)
      const secStoragePath = 'seed-financial-audits.zip';
      const secFullPath = path.join(STORAGE_DIR, secStoragePath);
      if (!fs.existsSync(secFullPath)) {
        fs.writeFileSync(
          secFullPath,
          createSampleZip('audit-summary.txt', 'DOCKWORLDWIDE SOC2 Type II and ISO 27001 Executive Audit Summary 2026.')
        );
      }
      const secStat = fs.statSync(secFullPath);
      const secPassHash = bcrypt.hashSync('SecretPass77', 10);

      inMemoryData.files.push({
        id: 'file_audit_004',
        title: 'SOC2 Type II & ISO 27001 Compliance Audit Reports',
        description: 'Third-party validated security certification and attestation reports for enterprise security audits.',
        storage_path: secStoragePath,
        original_filename: 'DOCK-Audit-Reports-2026.zip',
        file_type: 'application/zip',
        file_size: secStat.size,
        is_password_protected: true,
        password_hash: secPassHash,
        is_active: true,
        download_count: 3,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      });
    } catch (e) {
      console.error('Error creating seed files:', e);
    }
  }

  saveDb();
}

// Initialize right away
initializeDatabase();

export const db = {
  // Profiles
  getProfiles(): UserProfile[] {
    return [...inMemoryData.profiles];
  },

  findUserById(id: string): UserProfile | undefined {
    return inMemoryData.profiles.find((p) => p.id === id);
  },

  findUserByEmailOrUsername(identifier: string): UserProfile | undefined {
    const clean = identifier.trim().toLowerCase();
    return inMemoryData.profiles.find(
      (p) => p.email.toLowerCase() === clean || (p.username && p.username.toLowerCase() === clean)
    );
  },

  createUser(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): UserProfile {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      ...profile,
      id,
      created_at: now,
      updated_at: now,
    };
    inMemoryData.profiles.push(newUser);
    saveDb();
    return newUser;
  },

  updateUserStatus(id: string, status: UserProfile['approval_status']): UserProfile | null {
    const user = inMemoryData.profiles.find((p) => p.id === id);
    if (!user) return null;
    user.approval_status = status;
    user.updated_at = new Date().toISOString();
    saveDb();
    return user;
  },

  deleteUser(id: string): boolean {
    const initialLen = inMemoryData.profiles.length;
    inMemoryData.profiles = inMemoryData.profiles.filter((p) => p.id !== id);
    if (inMemoryData.profiles.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // Files
  getFiles(options?: { activeOnly?: boolean }): FileRecord[] {
    if (options?.activeOnly) {
      return inMemoryData.files.filter((f) => f.is_active);
    }
    return [...inMemoryData.files];
  },

  findFileById(id: string): FileRecord | undefined {
    return inMemoryData.files.find((f) => f.id === id);
  },

  createFile(fileData: Omit<FileRecord, 'id' | 'download_count' | 'created_at' | 'updated_at'>): FileRecord {
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const newFile: FileRecord = {
      ...fileData,
      id,
      download_count: 0,
      created_at: now,
      updated_at: now,
    };
    inMemoryData.files.unshift(newFile);
    saveDb();
    return newFile;
  },

  updateFile(id: string, updates: Partial<Omit<FileRecord, 'id' | 'created_at'>>): FileRecord | null {
    const file = inMemoryData.files.find((f) => f.id === id);
    if (!file) return null;
    Object.assign(file, updates, { updated_at: new Date().toISOString() });
    saveDb();
    return file;
  },

  incrementDownloadCount(id: string): number {
    const file = inMemoryData.files.find((f) => f.id === id);
    if (!file) return 0;
    file.download_count = (file.download_count || 0) + 1;
    file.updated_at = new Date().toISOString();
    saveDb();
    return file.download_count;
  },

  deleteFile(id: string): boolean {
    const file = inMemoryData.files.find((f) => f.id === id);
    if (!file) return false;
    // Delete physical file from disk
    const fullPath = path.join(STORAGE_DIR, file.storage_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('Failed to unlink file:', err);
      }
    }
    inMemoryData.files = inMemoryData.files.filter((f) => f.id !== id);
    saveDb();
    return true;
  },

  // Download Logs
  addDownloadLog(log: Omit<DownloadLog, 'id' | 'downloaded_at'>): DownloadLog {
    const newLog: DownloadLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      downloaded_at: new Date().toISOString(),
    };
    inMemoryData.download_logs.unshift(newLog);
    // Keep max 500 logs
    if (inMemoryData.download_logs.length > 500) {
      inMemoryData.download_logs = inMemoryData.download_logs.slice(0, 500);
    }
    saveDb();
    return newLog;
  },

  getDownloadLogs(): DownloadLog[] {
    return [...inMemoryData.download_logs];
  },

  // Stats
  getStats() {
    const users = inMemoryData.profiles.filter((p) => p.role !== 'admin');
    const totalUsers = users.length;
    const pendingUsers = users.filter((u) => u.approval_status === 'pending').length;
    const approvedUsers = users.filter((u) => u.approval_status === 'approved').length;
    const rejectedUsers = users.filter((u) => u.approval_status === 'rejected').length;
    const suspendedUsers = users.filter((u) => u.approval_status === 'suspended').length;
    const totalFiles = inMemoryData.files.length;
    const totalDownloads = inMemoryData.files.reduce((acc, curr) => acc + (curr.download_count || 0), 0);

    return {
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      suspendedUsers,
      totalFiles,
      totalDownloads,
    };
  },
};
