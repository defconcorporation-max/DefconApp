
export interface Client {
    id: number;
    name: string;
    company_name: string;
    plan: string;
    status: string;
    avatar_url?: string;
    folder_path?: string;
    email?: string;
    created_at: string;
}

export interface SocialLink {
    id: number;
    client_id: number;
    platform: string;
    url: string;
    username?: string;
}

export interface ContentIdea {
    id: number;
    client_id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
}

export interface Shoot {
    id: number;
    client_id: number;
    title: string;
    shoot_date: string;
    start_time?: string;
    end_time?: string;
    color?: string;
    project_id?: number | null;
    status: string;
    post_prod_status?: string;
}

export interface ShootVideo {
    id: number;
    shoot_id: number;
    title: string;
    completed: number;
    notes?: string; // Legacy
}

export interface ShootVideoNote {
    id: number;
    video_id: number;
    content: string;
    created_at: string;
}

export interface PipelineStage {
    id: number;
    label: string;
    value: string;
    color: string;
    order_index: number;
}


export interface Task {
    id: number;
    content: string;
    is_completed: boolean;
    order_index: number;
    created_at: string;
}

export interface Project {
    id: number;
    client_id: number;
    title: string;
    status: 'Active' | 'Completed' | 'Archived';
    created_at: string;
    shoot_count?: number;
    service_count?: number;
    total_value?: number;
}

export interface Service {
    id: number;
    name: string;
    description?: string;
    default_rate: number;
    rate_type: 'Fixed' | 'Hourly' | 'Day';
}

export interface ProjectService {
    id: number;
    project_id: number;
    service_id?: number | null;
    name: string;
    rate: number;
    quantity: number;
}

export interface PostProductionItem {
    id: number;
    shoot_id: number;
    status: 'Derush' | 'Editing' | 'Validation' | 'Archived';
    created_at: string;
    updated_at: string;
    shoot_title?: string;
    client_name?: string;
}

export interface Commission {
    id: number;
    client_id: number;
    project_id?: number | null;
    role_name: string;
    person_name: string;
    rate_type: 'Percentage' | 'Fixed';
    rate_value: number;
    created_at: string;
    status: 'Pending' | 'Paid';
    paid_date?: string | null;
}

export interface TeamMember {
    id: number;
    name: string;
    role: string;
    email: string;
    phone: string;
    hourly_rate: number;
    color: string;
}

export interface Settings {
    id: number;
    tax_tps_rate: number;
    tax_tvq_rate: number;
}

export interface ProjectTask {
    id: number;
    project_id: number;
    title: string;
    is_completed: boolean;
    due_date?: string;
    created_at: string;
    stage_id?: number;
    assigned_to?: number;
    // Joined fields
    assignee_name?: string;
    stage_name?: string;
    stage_color?: string;
    description?: string;
}

export interface TaskStage {
    id: number;
    name: string;
    color: string;
    position: number;
    is_default: boolean;
}

export interface Expense {
    id: number;
    description: string;
    amount_pre_tax: number;
    tps_amount: number;
    tvq_amount: number;
    total_amount: number;
    date: string;
    category?: string;
    created_at: string;
}

export interface Payment {
    id: number;
    client_id: number;
    amount: number;
    status: string;
    date: string;
    description: string;
    project_id?: number | null;
}

export interface Credential {
    id: number;
    client_id: number;
    service_name: string;
    username?: string;
    password?: string;
    created_at?: string;
}

export type Idea = ContentIdea;

export interface ShootWithClient extends Shoot {
    client_name: string;
    client_company?: string;
    project_title?: string;
}

export interface SocialAccount {
    id: number;
    client_id?: number | null;
    platform: 'instagram' | 'linkedin' | 'facebook';
    handle: string;
    avatar_url?: string;
    connected_at: string;
}

export interface SocialPost {
    id: number;
    account_id: number;
    content: string;
    media_url?: string;
    scheduled_date: string;
    status: 'Draft' | 'Scheduled' | 'Published';
    created_at: string;
    account?: SocialAccount; // For joined queries
}
