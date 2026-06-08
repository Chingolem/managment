import { createContext, useContext } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // App.jsx
    projectCreated: 'Project created successfully!',
    projectArchived: 'Project moved to archive. Will be deleted in 7 days.',
    projectRestored: 'Project restored!',
    confirmDelete: 'Are you sure? This action is irreversible.',
    projectDeleted: 'Project permanently deleted.',
    dataExported: 'Data exported successfully!',
    importFailed: 'Could not read file! Please check the file.',
    importSuccess: 'Data imported successfully!',
    changeTheme: 'Change Theme',
    title: 'TIMEROI',
    subtitle: 'Manage projects in one workspace',
    goBack: 'Go Back',
    videoCount: 'videos',
    createdOn: 'Created on',
    manage: 'Manage',
    analytics: 'Analytics',
    moveToArchive: 'Move to Archive',
    cancel: 'Cancel',
    archiveTooltip: 'Move project to archive',
    newProject: 'New Project',
    loading: 'Loading...',

    // Sidebar.jsx
    projects: 'Projects',
    completed: 'completed',
    daysLeft: 'days left',
    exportData: 'Export Data',
    importData: 'Import Data',

    // StatsBar.jsx
    progress: 'Progress',
    timeSpent: 'Time Spent',
    hours: 'h',
    minutes: 'm',
    revenue: 'Revenue',
    inProgress: 'In Progress',

    // FilterBar.jsx
    searchPlaceholder: 'Search notes or ID...',
    allStatus: 'All Statuses',
    notStarted: 'Not Started',
    paused: 'Paused',
    finished: 'Finished',

    // SetupForm.jsx
    createNewProject: 'Create New Project',
    clientNameLabel: 'Client / Channel Name',
    clientNamePlaceholder: 'e.g. Linus Tech Tips',
    videoCountLabel: 'Quantity',
    defaultPriceLabel: 'Default price per item ($)',
    createWorkspace: 'Create Workspace',

    // Visualizer.jsx
    totalRemainingTime: 'Total Remaining Time (Estimate)',
    noEstimates: 'No estimates available. Complete at least one video to generate estimates.',
    approxTimePerVideo: 'Approx. time per video',
    daysRequired: 'days required (based on 4h work/day)',

    // VideoCard.jsx
    videoTitle: 'Item',
    dragDrop: 'Drag to reorder',
    clickForDetails: 'Click to view & edit details',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    finish: 'Finish',
    reset: 'Reset',
    areYouSure: 'Are you sure?',

    // VideoOverlay.jsx
    startTimer: 'Start Timer',
    subTasks: 'Sub-tasks Checklist',
    newTaskPlaceholder: 'Add a new checklist item...',
    ideasNotes: 'Ideas & Notes',
    ideasPlaceholder: 'Write scripts draft ideas, timestamp notes or visual links here...',
    metadata: 'Workspace Metadata',
    sourceMaterial: 'Source Material Link',
    finalVideoLink: 'Final Video Link',
    deadline: 'Deadline',
    individualPrice: 'Individual Price ($)',
    saved: 'Saved!',
    saveDetails: 'Save Details & Close',

    // ArchiveSection.jsx
    archive: 'Archive',
    restore: 'Restore',
    deletePermanently: 'Delete Forever',
    permanentlyDelete: 'Delete Forever',

    // AuthScreen.jsx
    login_title: 'Sign In',
    signup_title: 'Create Account',
    username_label: 'Username',
    password_label: 'Password',
    confirm_password_label: 'Confirm Password',
    discord_label: 'Discord Username ID (Optional)',
    remember_me: 'Keep me signed in',
    login_btn: 'Sign In',
    signup_btn: 'Create Account',
    need_account: 'New to TIMEROI? Scroll down to register',
    have_account: 'Already have an account? Scroll up to sign in',
    logout_btn: 'Logout',
    auth_login_success: 'Logged in successfully!',
    auth_login_error: 'Invalid username or password.',
    auth_signup_success: 'Account created! You can now log in.',
    auth_username_short: 'Username must be at least 3 characters.',
    auth_password_short: 'Password must be at least 6 characters.',
    auth_user_exists: 'Username is already taken.',
    auth_logged_out: 'Logged out successfully.',
    auth_passwords_mismatch: 'Passwords do not match!',

    // Workspace & Role Quiz translations
    role_video_editor: 'Video Editor',
    role_thumbnail_artist: 'Thumbnail Artist',
    role_script_writer: 'Script Writer',
    role_manager: 'Manager / Producer',
    item_video: 'video',
    item_videos: 'videos',
    item_thumbnail: 'thumbnail',
    item_thumbnails: 'thumbnails',
    item_script: 'script',
    item_scripts: 'scripts',
    item_task: 'task',
    item_tasks: 'tasks',
    action_start_timer: 'Start Timer',
    action_start_design: 'Start Design',
    action_start_draft: 'Start Draft',
    action_track_task: 'Track Task',
    meta_source_material: 'Source Material Folder (Drive / Dropbox)',
    meta_final_link: 'Final Link',
    meta_asset_folder: 'Asset Folder Link',
    meta_figma_psd: 'Figma / PSD Project Link',
    meta_research_links: 'Research Materials / Doc Links',
    meta_google_doc: 'Google Doc Link',
    meta_assignee: 'Assignee Name / Role',
    meta_board_link: 'Project Board Link',
    meta_deadline: 'Deadline',
    meta_price: 'Price ($)',
    status_not_started: 'To Do',
    status_started: 'In Progress',
    status_paused: 'Paused',
    status_finished: 'Finished',
    status_to_design: 'To Design',
    status_designing: 'Designing',
    status_feedback: 'Feedback',
    status_approved: 'Approved',
    status_ideas: 'Ideas',
    status_writing: 'Writing',
    status_review: 'Review',
    status_completed_script: 'Completed',
    status_backlog: 'Backlog',
    status_assigned: 'Assigned',
    status_done: 'Done',
    quiz_title: 'Choose Your Workspace Archetype',
    quiz_desc: 'Select your role. We will automatically configure column statuses, metadata fields, and action buttons to fit your exact workflow.',
    quiz_button: 'Enter Workspace',
    change_role: 'Switch Archetype',

    // ThemeSettingsModal.jsx
    theme_dark: 'Dark',
    theme_light: 'Light',
    theme_slate: 'Slate',
    theme_save_use: 'Save & Apply Theme'
  }
};

export function LanguageProvider({ children }) {
  const t = (key) => {
    return translations.en[key] || key;
  };

  const toggleLanguage = () => {};

  return (
    <LanguageContext.Provider value={{ language: 'en', setLanguage: () => {}, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
