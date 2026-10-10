export type UserRole = 'admin' | 'user';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at?: string;
}

export interface FileItem {
  id: string;
  title: string;
  description: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  is_password_protected: boolean;
  is_active?: boolean;
  download_count: number;
  created_at: string;
  updated_at?: string;
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

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  suspendedUsers: number;
  totalFiles: number;
  totalDownloads: number;
}
