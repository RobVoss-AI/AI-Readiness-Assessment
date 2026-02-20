// assessment-config.js — Single source of truth for questions, scoring, and insights
// All questions from coreQuestions.json, all scoring formulas, all insight rules.

const sections = [
  {
    id: 'strategy',
    title: 'AI Strategy & Vision',
    description: 'Assess your organization\'s strategic approach to AI adoption',
    weight: 1.2,
    questions: [
      {
        id: 'strategy_vision',
        type: 'likert',
        weight: 1.5,
        required: true,
        question: 'Our organization has a written AI vision that is understood by key decision-makers.',
        options: ['Strongly Disagree', 'Disagree', 'Unsure', 'Agree', 'Strongly Agree'],
        helpText: 'A clear AI vision aligns initiatives with business goals'
      },
      {
        id: 'strategy_problems',
        type: 'likert',
        weight: 1.3,
        required: true,
        question: 'We have documented, measurable use-cases where AI is expected to drive specific outcomes (e.g., cost reduction, revenue growth).',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'strategy_leadership',
        type: 'likert',
        weight: 1.4,
        required: true,
        question: 'Senior leaders visibly champion AI projects (e.g., set goals, allocate time, celebrate wins).',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'strategy_budget',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'Adequate budget _and_ staff time have been earmarked for our next AI initiative.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'strategy_risk_culture',
        type: 'likert',
        weight: 1.3,
        required: true,
        question: 'Taking calculated risks with new technology is rewarded in our culture (e.g., pilots, rapid prototyping).',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'strategy_obstacles',
        type: 'text',
        weight: 1.0,
        required: false,
        question: 'Briefly describe one obstacle or opportunity your team faces with AI adoption.',
        placeholder: 'e.g., Lack of technical expertise, regulatory concerns, exciting automation possibilities'
      }
    ]
  },
  {
    id: 'operations',
    title: 'Operational Readiness',
    description: 'Evaluate how well your operations can integrate AI solutions',
    weight: 1.0,
    questions: [
      {
        id: 'ops_process_mapping',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'We have documented and mapped our key business processes in detail.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'ops_automation_candidates',
        type: 'likert',
        weight: 1.3,
        required: true,
        question: 'We have identified repetitive, rule-based tasks that could be automated.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'ops_change_readiness',
        type: 'likert',
        weight: 1.1,
        required: true,
        question: 'Our operational teams are receptive to process changes enabled by AI.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'ops_priority_areas',
        type: 'multiple',
        weight: 1.0,
        required: true,
        question: 'Which operational area would benefit most from AI enhancement?',
        options: [
          'Customer service and support',
          'Supply chain and logistics',
          'Financial operations and reporting',
          'Human resources and talent management',
          'Sales and marketing processes',
          'Product development and innovation'
        ]
      },
      {
        id: 'ops_bottlenecks',
        type: 'text',
        weight: 1.0,
        required: false,
        question: 'What are the biggest operational bottlenecks that AI might help address? (Optional)',
        placeholder: 'e.g., Manual data entry, slow approval processes, inconsistent quality control'
      }
    ]
  },
  {
    id: 'technology',
    title: 'Technology Infrastructure',
    description: 'Assess your technical readiness for AI implementation',
    weight: 1.1,
    questions: [
      {
        id: 'tech_infrastructure',
        type: 'likert',
        weight: 1.3,
        required: true,
        question: 'Our computing resources\u2014whether on-site, cloud-based, or vendor-hosted\u2014can handle data-intensive tasks such as AI analysis or large-scale reporting.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'tech_cloud_experience',
        type: 'likert',
        weight: 1.1,
        required: true,
        question: 'We have practical experience running key business software on remote or cloud-style services (e.g., SaaS platforms or managed hosting), not only on local servers.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'tech_integration',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'Essential business data (sales, operations, customer, etc.) can be consolidated or connected in one place when needed for new tools like AI.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'tech_security',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'Security safeguards\u2014such as role-based access, encryption, and regular reviews\u2014cover our data and any external services we use.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'tech_barriers',
        type: 'text',
        weight: 1.0,
        required: false,
        question: 'Briefly describe one technology-related barrier or concern that could slow AI adoption in your organization.',
        placeholder: 'e.g., Legacy system integration challenges, security compliance requirements, limited technical expertise'
      }
    ]
  },
  {
    id: 'data',
    title: 'Data Quality & Governance',
    description: 'Evaluate your data readiness for AI applications',
    weight: 1.3,
    questions: [
      {
        id: 'data_quality',
        type: 'likert',
        weight: 1.4,
        required: true,
        question: 'We have high-quality, well-structured data available for AI projects.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'data_accessibility',
        type: 'likert',
        weight: 1.3,
        required: true,
        question: 'Our data is well-organized and easily accessible to relevant teams.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'data_governance',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'We have strong data governance policies and procedures in place.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'data_collection',
        type: 'likert',
        weight: 1.1,
        required: true,
        question: 'We regularly collect and analyze customer and operational data.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'data_challenges',
        type: 'multiple',
        weight: 1.2,
        required: true,
        question: 'What is your biggest data challenge for AI implementation?',
        options: [
          'Poor data quality and inconsistencies',
          'Data scattered across disconnected systems',
          'Insufficient relevant data for AI training',
          'Privacy, security, and compliance concerns',
          'Limited data analysis and interpretation skills',
          'Inadequate data storage and processing infrastructure'
        ]
      }
    ]
  },
  {
    id: 'culture',
    title: 'Organizational Culture',
    description: 'Assess cultural readiness for AI adoption and change',
    weight: 1.0,
    questions: [
      {
        id: 'culture_enthusiasm',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'Employees in our organization express genuine interest in exploring AI\'s benefits for their work.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'culture_change_embrace',
        type: 'likert',
        weight: 1.1,
        required: true,
        question: 'When new technology is introduced, teams adapt quickly and share lessons learned rather than resisting change.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'culture_upskilling',
        type: 'likert',
        weight: 1.3,
        required: true,
        question: 'Managers actively support continuous learning\u2014for example, allocating time or budget for AI-related training.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'culture_collaboration',
        type: 'likert',
        weight: 1.0,
        required: true,
        question: 'Cross-functional projects bring technical and business staff together to solve problems or pilot new tools.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'culture_value_concerns',
        type: 'text',
        weight: 1.0,
        required: false,
        question: 'Briefly describe one way AI could create value\u2014or one concern\u2014you have for your organization.',
        placeholder: 'e.g., Automate repetitive tasks to free up strategic work, or concerns about data privacy and job security'
      }
    ]
  },
  {
    id: 'automation',
    title: 'Automation Readiness',
    description: 'Identify current automation experience and opportunities',
    weight: 0.9,
    questions: [
      {
        id: 'auto_current_state',
        type: 'likert',
        weight: 1.1,
        required: true,
        question: 'At least one routine workflow in our organization already runs through an automated system (e.g., RPA bot, low-code trigger, or scheduled script).',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'auto_employee_understanding',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'Employees view automation as removing repetitive tasks so they can focus on higher-value work.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'auto_hands_on_experience',
        type: 'likert',
        weight: 1.2,
        required: true,
        question: 'Teams have hands-on experience configuring or maintaining automation tools (e.g., Zapier, Power Automate, custom scripts).',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'auto_measurement',
        type: 'likert',
        weight: 1.0,
        required: true,
        question: 'We track and share metrics\u2014such as time saved, error reduction, or cost impact\u2014to demonstrate ROI from recent automation projects.',
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        id: 'auto_specific_tasks',
        type: 'text',
        weight: 1.0,
        required: false,
        question: 'Briefly describe one manual task you would most like to automate in the next year.',
        placeholder: 'e.g., Weekly report compilation, invoice processing, customer inquiry routing, inventory updates'
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// Scoring engine
// ---------------------------------------------------------------------------

function scoreQuestion(question, answer) {
  if (answer === undefined || answer === null) return null;

  if (question.type === 'likert') {
    // 0-4 scale mapped to 0-100
    const numAnswer = Number(answer);
    if (isNaN(numAnswer) || numAnswer < 0 || numAnswer > 4) return null;
    return (numAnswer / 4) * 100;
  }

  if (question.type === 'multiple') {
    // Categorical — any selection awards full engagement points
    return 100;
  }

  if (question.type === 'text') {
    // Completion credit for non-empty text
    return (typeof answer === 'string' && answer.trim().length > 0) ? 75 : 0;
  }

  return null;
}

function calculateSectionScore(section, answers) {
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const q of section.questions) {
    const raw = scoreQuestion(q, answers[q.id]);
    if (raw === null) continue;
    totalWeighted += raw * q.weight;
    totalWeight += q.weight;
  }

  return totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0;
}

function calculateScores(answers) {
  const sectionResults = {};
  let overallWeighted = 0;
  let overallWeight = 0;

  for (const section of sections) {
    const score = calculateSectionScore(section, answers);
    sectionResults[section.id] = {
      score,
      title: section.title,
      weight: section.weight
    };
    overallWeighted += score * section.weight;
    overallWeight += section.weight;
  }

  const overall = overallWeight > 0 ? Math.round(overallWeighted / overallWeight) : 0;
  return { overall, sections: sectionResults };
}

// ---------------------------------------------------------------------------
// Readiness levels
// ---------------------------------------------------------------------------

const readinessLevels = [
  { min: 0,  max: 25,  label: 'Beginning',    description: 'Your organization is at the start of its AI journey. Focus on building awareness and foundational capabilities.' },
  { min: 26, max: 50,  label: 'Developing',   description: 'You have some building blocks in place. Targeted investments in strategy and data will accelerate progress.' },
  { min: 51, max: 75,  label: 'Intermediate',  description: 'A solid foundation exists. Refining governance and expanding pilot projects will unlock the next level.' },
  { min: 76, max: 100, label: 'Advanced',      description: 'Your organization is well positioned for AI at scale. Focus on optimization and continuous innovation.' }
];

function getReadinessLevel(score) {
  for (const level of readinessLevels) {
    if (score >= level.min && score <= level.max) return level;
  }
  return readinessLevels[0];
}

// ---------------------------------------------------------------------------
// Insight generation
// ---------------------------------------------------------------------------

const strengthMessages = {
  strategy:   (s) => `Your strong strategic foundation (${s}%) provides excellent direction for AI initiatives.`,
  operations: (s) => `Your operational readiness (${s}%) positions you well for AI implementation.`,
  technology: (s) => `Your technology infrastructure (${s}%) can support advanced AI solutions.`,
  data:       (s) => `Your data capabilities (${s}%) are a key asset for AI success.`,
  culture:    (s) => `Your organizational culture (${s}%) will facilitate smooth AI adoption.`,
  automation: (s) => `Your automation experience (${s}%) provides a solid foundation for AI expansion.`
};

const weaknessMessages = {
  strategy:   (s) => `Developing a clearer AI strategy (currently ${s}%) should be a top priority.`,
  operations: (s) => `Improving operational readiness (${s}%) will accelerate AI benefits.`,
  technology: (s) => `Strengthening technology infrastructure (${s}%) is essential for AI success.`,
  data:       (s) => `Enhancing data quality and governance (${s}%) will unlock AI potential.`,
  culture:    (s) => `Building cultural readiness (${s}%) is crucial for sustainable AI adoption.`,
  automation: (s) => `Expanding automation capabilities (${s}%) will create quick wins.`
};

const roleRecommendations = {
  'Team Member': [
    'Focus on building AI literacy and understanding how AI can enhance your daily work.',
    'Identify repetitive tasks in your workflow that could benefit from automation.',
    'Engage with AI training programs and stay current with AI tools in your field.'
  ],
  Manager: [
    'Develop a departmental AI strategy aligned with business objectives.',
    'Build a business case for AI initiatives with clear ROI projections.',
    'Foster an AI-positive culture within your team through education and involvement.'
  ],
  Executive: [
    'Establish organization-wide AI governance and strategic direction.',
    'Allocate appropriate budget and resources for AI transformation.',
    'Champion AI initiatives and communicate the vision across the organization.'
  ],
  Consultant: [
    'Leverage AI assessment frameworks to guide client recommendations.',
    'Develop expertise in AI implementation methodologies and best practices.',
    'Build partnerships with AI technology providers to enhance service offerings.'
  ]
};

const industryOpportunities = {
  'Finance & Banking': [
    'Implement AI-powered fraud detection to reduce financial losses.',
    'Use predictive analytics for credit risk assessment and loan decisions.',
    'Deploy chatbots for customer service to improve response times.'
  ],
  Healthcare: [
    'Leverage AI for diagnostic imaging to improve accuracy and speed.',
    'Implement predictive analytics for patient outcome improvement.',
    'Use AI for administrative automation to reduce costs.'
  ],
  Education: [
    'Deploy personalized learning systems to improve student outcomes.',
    'Use AI for automated grading and feedback to save time.',
    'Implement predictive analytics for student success intervention.'
  ],
  Legal: [
    'Use AI for document review and analysis to increase efficiency.',
    'Implement contract analysis tools to reduce review time.',
    'Deploy legal research AI to improve case preparation.'
  ],
  Manufacturing: [
    'Implement predictive maintenance to reduce downtime.',
    'Use computer vision for quality control and defect detection.',
    'Deploy AI for supply chain optimization.'
  ],
  Retail: [
    'Implement personalized recommendation engines to increase sales.',
    'Use AI for inventory management and demand forecasting.',
    'Deploy chatbots for customer service and support.'
  ]
};

const genericRecommendations = [
  'Identify process automation opportunities to improve efficiency.',
  'Implement data analytics to gain better business insights.',
  'Explore AI tools specific to your industry and use cases.'
];

function generateInsights(sectionScores, overall) {
  // Build sorted list
  const sorted = Object.entries(sectionScores)
    .map(([id, data]) => ({ id, score: data.score, title: data.title }))
    .sort((a, b) => b.score - a.score);

  const strengths = sorted.slice(0, 2).map((item) => ({
    area: item.title,
    score: item.score,
    message: (strengthMessages[item.id] || ((s) => `Strong performance in ${item.title} (${s}%).`))(item.score)
  }));

  const weaknesses = sorted.slice(-2).map((item) => ({
    area: item.title,
    score: item.score,
    message: (weaknessMessages[item.id] || ((s) => `This area needs attention (${s}%).`))(item.score)
  }));

  // Generic recommendations (role/industry-specific only if provided)
  const recommendations = genericRecommendations;
  const opportunities = genericRecommendations;

  return { strengths, weaknesses, recommendations, opportunities };
}

// ---------------------------------------------------------------------------
// Client-safe config (no weights exposed)
// ---------------------------------------------------------------------------

function getClientConfig() {
  return {
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      questions: s.questions.map((q) => ({
        id: q.id,
        type: q.type,
        required: q.required,
        question: q.question,
        options: q.options,
        helpText: q.helpText,
        placeholder: q.placeholder
      }))
    }))
  };
}

// ---------------------------------------------------------------------------
// Collect free-text responses for CRM / notes
// ---------------------------------------------------------------------------

function extractFreeResponses(answers) {
  const freeResponses = {};
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.type === 'text' && answers[q.id] && String(answers[q.id]).trim().length > 0) {
        freeResponses[q.id] = String(answers[q.id]).trim();
      }
    }
  }
  return freeResponses;
}

module.exports = {
  sections,
  readinessLevels,
  scoreQuestion,
  calculateSectionScore,
  calculateScores,
  getReadinessLevel,
  generateInsights,
  getClientConfig,
  extractFreeResponses,
  roleRecommendations,
  industryOpportunities
};
