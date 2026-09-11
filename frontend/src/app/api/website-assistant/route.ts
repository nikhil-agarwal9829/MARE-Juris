import { NextResponse } from 'next/server';

const WEBSITE_HELP_KNOWLEDGE = [
  {
    keywords: ['what is mare-juris', 'what is mare juris', 'about mare-juris', 'about mare juris', 'what does mare-juris do'],
    response: 'MARE-Juris (Multi-Agent Retrieval-Enhanced Framework for Intelligent Legal Decision Support) is an evidence-grounded LegalTech platform designed to help legal professionals and businesses navigate Indian statutes, case law, compliance obligations, and legal research.'
  },
  {
    keywords: ['how does it work', 'how to use', 'how does mare-juris work', 'features'],
    response: 'MARE-Juris works by providing: 1) Ask MARE-Juris (dedicated legal assistant with statutory evidence verification), 2) Document Risk Analysis, 3) Corporate Compliance Engine, and 4) Legal & Business Pulse news feed.'
  },
  {
    keywords: ['where are my chats', 'previous chats', 'chat history', 'conversations'],
    response: 'You can find your previous legal consultation threads in the left sidebar of the dedicated Ask MARE-Juris page at /ask-juris.'
  },
  {
    keywords: ['what is ask mare-juris', 'ask juris', 'ask mare juris'],
    response: 'Ask MARE-Juris is our dedicated main legal assistant located at /ask-juris. It performs legal query analysis, statutory RAG retrieval, cross-encoder reranking, and evidence verification under Indian Law.'
  },
  {
    keywords: ['evidence', 'verified evidence', 'evidence cards'],
    response: 'The Verified Legal Evidence section shows exact statutory provisions (Act Name, Section, Subsection) and Supreme/High Court precedents that support each answer provided in Ask MARE-Juris.'
  }
];

const LEGAL_QUERY_TRIGGERS = [
  'rights', 'tenant', 'landlord', 'evict', 'eviction', 'section', 'article',
  'bns', 'ipc', 'crpc', 'bnss', 'bsa', 'fir', 'police', 'bail', 'notice',
  'complaint', 'sue', 'court', 'judge', 'lawyer', 'advocate', 'cheating',
  'agreement', 'lease', 'contract', 'bill', 'maintenance', 'divorce'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { response: 'Hello! I am the MARE-Juris Website Assistant. How can I help you navigate the platform today?' },
        { status: 400 }
      );
    }

    const queryLower = message.trim().toLowerCase();

    // Check if query is a legal question -> Redirect to Ask MARE-Juris!
    const isLegalQuestion = LEGAL_QUERY_TRIGGERS.some((trig) => queryLower.includes(trig));

    if (isLegalQuestion) {
      return NextResponse.json({
        isLegalRedirect: true,
        response: 'For legal questions, please use Ask MARE-Juris. It is the dedicated legal assistant and can search the available legal evidence.',
        targetUrl: '/ask-juris',
        buttonText: 'Open Ask MARE-Juris →'
      });
    }

    // Match website / product help knowledge base
    for (const item of WEBSITE_HELP_KNOWLEDGE) {
      if (item.keywords.some((kw) => queryLower.includes(kw))) {
        return NextResponse.json({
          isLegalRedirect: false,
          response: item.response
        });
      }
    }

    // Default general website guidance
    return NextResponse.json({
      isLegalRedirect: false,
      response: 'I am the MARE-Juris Website & Product Assistant. I can help you with navigation, platform features, account settings, and how to use our legal workspace. For specific legal inquiries under Indian Law, please use Ask MARE-Juris at /ask-juris.'
    });
  } catch (error) {
    return NextResponse.json(
      { response: 'I am the MARE-Juris Website Assistant. How can I help you navigate the platform?' },
      { status: 500 }
    );
  }
}
