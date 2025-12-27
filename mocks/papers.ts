import type { Author, Paper, PaperRegistration, Review, Reviewer, Topic, ReviewerWorkload, PaperAnalytics, PaperStatus, PaperPhase, PresentationPreference } from '@/types/papers';

// Mock topics
export const mockTopics: Topic[] = [
  {
    topic_id: 'topic-1',
    name: 'Clinical Pathology',
    description: 'General clinical pathology topics',
  },
  {
    topic_id: 'topic-2',
    name: 'Hematology',
    description: 'Blood and hematology disorders',
  },
  {
    topic_id: 'topic-3',
    name: 'Immunology',
    description: 'Immune system and immunological disorders',
  },
  {
    topic_id: 'topic-4',
    name: 'Microbiology',
    description: 'Microbiology and infectious diseases',
  },
];

// Mock reviewers
export const mockReviewers: Reviewer[] = [
  {
    user_id: 'reviewer-1',
    name: 'Dr. Ahmad Susanto',
    email: 'ahmad.susanto@patklin.org',
    assigned_papers_count: 5,
    completed_reviews_count: 3,
    pending_reviews_count: 2,
  },
  {
    user_id: 'reviewer-2',
    name: 'Prof. Siti Nurhaliza',
    email: 'siti.nurhaliza@patklin.org',
    assigned_papers_count: 8,
    completed_reviews_count: 7,
    pending_reviews_count: 1,
  },
  {
    user_id: 'reviewer-3',
    name: 'Dr. Budi Hartono',
    email: 'budi.hartono@patklin.org',
    assigned_papers_count: 4,
    completed_reviews_count: 2,
    pending_reviews_count: 2,
  },
  {
    user_id: 'reviewer-4',
    name: 'Dr. Eka Prasetya',
    email: 'eka.prasetya@patklin.org',
    assigned_papers_count: 6,
    completed_reviews_count: 4,
    pending_reviews_count: 2,
  },
];

// Mock authors
const generateAuthors = (count: number): Author[] => {
  const firstNames = ['Ahmad', 'Siti', 'Budi', 'Eka', 'Rina', 'Dedi', 'Lina', 'Roni'];
  const lastNames = ['Susanto', 'Nurhaliza', 'Hartono', 'Prasetya', 'Rahman', 'Wijaya', 'Santoso', 'Purnomo'];
  const authors: Author[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    authors.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.ac.id`,
      affiliation: ['University of Indonesia', 'Bandung Institute of Technology', 'Airlangga University', 'Diponegoro University'][Math.floor(Math.random() * 4)],
      is_presenter: i === 0,
    });
  }
  return authors;
};

// Mock registration generator
const generateRegistration = (paperId: string, status: PaperStatus): PaperRegistration => {
  const firstNames = ['Ahmad', 'Siti', 'Budi', 'Eka', 'Rina', 'Dedi', 'Lina', 'Roni'];
  const lastNames = ['Susanto', 'Nurhaliza', 'Hartono', 'Prasetya', 'Rahman', 'Wijaya', 'Santoso', 'Purnomo'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  const regStatuses = ['RAP', 'RPP', 'RCN', 'RIC'];
  const transStatuses = ['TCM', 'TIN', 'TAB'];

  const isApproved = status.includes('approved') || status.includes('accepted') || status === 'under_review';
  const regStatus = isApproved ? 'RAP' : regStatuses[Math.floor(Math.random() * 2)];
  const transStatus = regStatus === 'RAP' ? 'TCM' : (regStatus === 'RPP' ? 'TIN' : undefined);

  return {
    registration_id: `reg-${paperId}`,
    user_id: `user-${paperId}`,
    registrant_name: `Dr. ${firstName} ${lastName}`,
    registrant_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@patklin.org`,
    registration_status_id: regStatus,
    transaction_status_id: transStatus,
    submission_fee_paid: transStatus === 'TCM',
    registration_date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
  };
};

// Mock papers
export const mockPapers: Paper[] = [
  {
    paper_id: 'paper-1',
    event_id: 'evt-1',
    reg_id: 'reg-paper-1',
    user_id: 'user-1',
    topic_id: 'topic-1',
    title: 'Novel Diagnostic Approach for Early Detection of Diabetes Mellitus',
    abstract: 'This study presents a novel diagnostic approach using biomarkers for early detection of diabetes mellitus. We analyzed 500 patients and found significant improvements in detection accuracy.',
    authors: generateAuthors(3),
    current_status: 'abstract_submitted',
    current_phase: 'abstract',
    presentation_preference: 'oral',
    submitted_at: '2025-01-10T10:30:00Z',
    updated_at: '2025-01-10T10:30:00Z',
    topic: mockTopics[0],
    assigned_reviewers: [],
    review_count: 0,
    keywords: ['diabetes', 'biomarkers', 'diagnosis', 'early detection'],
    registration: generateRegistration('paper-1', 'abstract_submitted'),
  },
  {
    paper_id: 'paper-2',
    event_id: 'evt-1',
    reg_id: 'reg-paper-2',
    user_id: 'user-2',
    topic_id: 'topic-2',
    title: 'Hematological Changes in COVID-19 Patients: A Longitudinal Study',
    abstract: 'Longitudinal study examining hematological parameters in COVID-19 patients across different disease stages. Results show significant associations with disease severity.',
    authors: generateAuthors(4),
    current_status: 'abstract_approved',
    current_phase: 'abstract',
    presentation_preference: 'poster',
    submitted_at: '2025-01-05T14:20:00Z',
    updated_at: '2025-01-05T14:20:00Z',
    topic: mockTopics[1],
    assigned_reviewers: [mockReviewers[0], mockReviewers[1]],
    review_count: 1,
    keywords: ['COVID-19', 'hematology', 'longitudinal study'],
    registration: generateRegistration('paper-2', 'abstract_approved'),
  },
  {
    paper_id: 'paper-3',
    event_id: 'evt-1',
    reg_id: 'reg-paper-3',
    user_id: 'user-3',
    topic_id: 'topic-3',
    title: 'Immunological Response in Vaccine-Induced Thrombotic Thrombocytopenia',
    abstract: 'Investigation of immunological mechanisms in vaccine-induced thrombotic thrombocytopenia. Study included 200 patients with detailed immunological profiling.',
    authors: generateAuthors(5),
    current_status: 'full_paper_submitted',
    current_phase: 'full_paper',
    presentation_preference: 'either',
    submitted_at: '2025-01-08T09:15:00Z',
    updated_at: '2025-01-08T09:15:00Z',
    topic: mockTopics[2],
    assigned_reviewers: [mockReviewers[2]],
    review_count: 0,
    keywords: ['vaccine', 'thrombocytopenia', 'immunology'],
    registration: generateRegistration('paper-3', 'full_paper_submitted'),
  },
  {
    paper_id: 'paper-4',
    event_id: 'evt-1',
    reg_id: 'reg-paper-4',
    user_id: 'user-4',
    topic_id: 'topic-4',
    title: 'Rapid Diagnostic Methods for Bacterial Identification in Clinical Samples',
    abstract: 'Comparison of traditional and rapid diagnostic methods for bacterial identification. Rapid methods showed 95% sensitivity and 98% specificity.',
    authors: generateAuthors(3),
    current_status: 'full_paper_accepted',
    current_phase: 'full_paper',
    presentation_preference: 'oral',
    submitted_at: '2024-12-20T11:45:00Z',
    updated_at: '2024-12-20T11:45:00Z',
    topic: mockTopics[3],
    assigned_reviewers: [mockReviewers[0], mockReviewers[3]],
    review_count: 2,
    keywords: ['microbiology', 'rapid diagnosis', 'bacterial identification'],
    registration: generateRegistration('paper-4', 'full_paper_accepted'),
  },
  {
    paper_id: 'paper-5',
    event_id: 'evt-1',
    reg_id: 'reg-paper-5',
    user_id: 'user-5',
    topic_id: 'topic-1',
    title: 'Quality Control in Clinical Laboratory: A Five-Year Analysis',
    abstract: 'Comprehensive analysis of quality control parameters in clinical laboratory over five years. Identifies trends and recommendations for improvement.',
    authors: generateAuthors(2),
    current_status: 'abstract_revision',
    current_phase: 'abstract',
    presentation_preference: 'either',
    submitted_at: '2025-01-12T15:30:00Z',
    updated_at: '2025-01-12T15:30:00Z',
    topic: mockTopics[0],
    assigned_reviewers: [],
    review_count: 0,
    keywords: ['quality control', 'clinical laboratory', 'standards'],
    registration: generateRegistration('paper-5', 'abstract_revision'),
  },
];

// Mock reviews
export const mockReviews: Review[] = [
  {
    review_id: 'review-1',
    paper_id: 'paper-2',
    reviewer_id: mockReviewers[0].user_id,
    reviewer: mockReviewers[0],
    phase: 'abstract',
    version: 1,
    quality_score: 5,
    relevance_score: 5,
    recommendation: 'accept',
    comments: 'Excellent study with comprehensive data. Well-written and methodologically sound.',
    submitted_at: '2025-01-15T10:30:00Z',
  },
  {
    review_id: 'review-2',
    paper_id: 'paper-4',
    reviewer_id: mockReviewers[0].user_id,
    reviewer: mockReviewers[0],
    phase: 'full_paper',
    version: 1,
    quality_score: 4,
    relevance_score: 4,
    recommendation: 'accept',
    comments: 'Good study with practical applications. Recommend minor revision of statistical analysis.',
    submitted_at: '2025-01-14T14:20:00Z',
  },
];

// Mock reviewer workload
export const mockReviewerWorkload: ReviewerWorkload[] = mockReviewers.map((reviewer) => ({
  reviewer,
  assigned_count: reviewer.assigned_papers_count,
  completed_count: reviewer.completed_reviews_count || 0,
  pending_count: reviewer.pending_reviews_count || 0,
}));

// Mock paper analytics
export const mockPaperAnalytics: PaperAnalytics = {
  total_submissions: 5,
  by_status: {
    pending: 1,
    under_review: 2,
    accepted: 1,
    rejected: 1,
  },
  by_topic: {
    'topic-1': 2,
    'topic-2': 1,
    'topic-3': 1,
    'topic-4': 1,
  },
  submissions_over_time: [
    { date: '2024-12-20', count: 1 },
    { date: '2025-01-05', count: 1 },
    { date: '2025-01-08', count: 1 },
    { date: '2025-01-10', count: 1 },
    { date: '2025-01-12', count: 1 },
  ],
};
