const { saveForm, saveResponses } = require('../utils/storage')

const FORM_ID = 'demo_survey'

function createForm() {
  const now = new Date().toISOString()

  const form = {
    id: FORM_ID,
    title: 'Customer Feedback Survey',
    description:
      'Help us improve by answering a few quick questions about your recent experience.',
    theme_color: '#6366f1',
    accepting_responses: true,
    created_at: now,
    updated_at: now,
    questions: [
      {
        id: 'q1',
        type: 'rating',
        question: 'Overall, how satisfied are you with our product?',
        scale: 5,
      },
      {
        id: 'q2',
        type: 'mcq',
        question: 'How often do you use our product?',
        options: ['Daily', 'Several times a week', 'Once a week', 'Rarely'],
      },
      {
        id: 'q3',
        type: 'mcq',
        question: 'How easy was it to get started?',
        options: ['Very easy', 'Somewhat easy', 'Neutral', 'Difficult'],
      },
      {
        id: 'q4',
        type: 'checkbox',
        question: 'Which features do you find most valuable?',
        options: [
          'Form builder UI',
          'Templates',
          'Analytics & reports',
          'Integrations',
          'Sharing & embedding',
        ],
      },
      {
        id: 'q5',
        type: 'text',
        question: 'What is one thing we could improve?',
      },
      {
        id: 'q6',
        type: 'true_false',
        question: 'Would you recommend our product to a friend or colleague?',
        options: ['Yes', 'No'],
      },
      {
        id: 'q7',
        type: 'dropdown',
        question: 'What best describes your role?',
        options: [
          'Student',
          'Individual creator',
          'Small business',
          'Enterprise',
          'Other',
        ],
      },
      {
        id: 'q8',
        type: 'rating',
        question: 'How satisfied are you with the form builder speed and performance?',
        scale: 5,
      },
      {
        id: 'q9',
        type: 'paragraph',
        question: 'Please describe a recent use case where our product helped you.',
      },
      {
        id: 'q10',
        type: 'date',
        question: 'When did you last use our product?',
      },
    ],
  }

  saveForm(form)
  return form
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickSome(arr) {
  return arr.filter(() => Math.random() < 0.4)
}

function randomDateWithin(daysBack = 30) {
  const now = Date.now()
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000)
  return new Date(now - offset).toISOString().slice(0, 10)
}

function createResponses(form, count = 100) {
  const responses = []

  const improvementSamples = [
    'Loading time on large forms could be faster.',
    'More ready-made templates would help us move quicker.',
    'I would love deeper analytics and export options.',
    'The mobile editing experience could be smoother.',
    'Better integrations with other tools we use would be great.',
  ]

  const useCaseSamples = [
    'We used it to collect customer feedback after a product launch and quickly identified top feature requests.',
    'It helped us run an internal employee satisfaction survey with very little setup time.',
    'We created event registration forms and exported responses to CSV for our CRM.',
    'Our team used it to run usability tests and gather structured feedback.',
    'We used it to manage support escalations by routing responses to different teams.',
  ]

  const roles = ['Student', 'Individual creator', 'Small business', 'Enterprise', 'Other']

  for (let i = 0; i < count; i++) {
    const submitted_at = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()

    const answers = {
      q1: String(3 + Math.floor(Math.random() * 3)), // 3–5
      q2: pickRandom(['Daily', 'Several times a week', 'Once a week', 'Rarely']),
      q3: pickRandom(['Very easy', 'Somewhat easy', 'Neutral', 'Difficult']),
      q4: pickSome([
        'Form builder UI',
        'Templates',
        'Analytics & reports',
        'Integrations',
        'Sharing & embedding',
      ]),
      q5: pickRandom(improvementSamples),
      q6: pickRandom(['Yes', 'No']),
      q7: pickRandom(roles),
      q8: String(3 + Math.floor(Math.random() * 3)), // 3–5
      q9: pickRandom(useCaseSamples),
      q10: randomDateWithin(30),
    }

    responses.push({
      id: `r_${i + 1}`,
      submitted_at,
      answers,
    })
  }

  saveResponses(form.id, responses)
  return responses
}

function main() {
  const form = createForm()
  const responses = createResponses(form, 100)
  console.log(`Seeded form "${form.title}" with id="${form.id}" and ${responses.length} responses.`)
}

main()

