import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is not configured");
    error.statusCode = 500;
    throw error;
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function buildInvestorPrompt(data) {
  return `
You are a financial assistant.

Based on this investor portfolio data:

Total Invested: ${data.totalInvested}
Current Value: ${data.currentValue}
Profit/Loss: ${data.profitLoss}
Top Industry: ${data.topIndustry}
Best Investment: ${data.bestStartup}
Worst Investment: ${data.worstStartup}

Give:

1. A short summary (1-2 lines)
2. Risk insight
3. Recommendation for next move

Keep it concise and in bullet points.
`;
}

function buildFounderPrompt(data) {
  return `
You are a startup growth assistant.

Based on this founder dashboard data:

Total Startups: ${data.totalStartups}
Active Startups: ${data.activeStartups}
Total Funding Raised: ${data.totalFundingRaised}
Total Investors: ${data.totalInvestors}
Top Startup: ${data.topStartup}
Weakest Startup: ${data.weakestStartup}

Give:

1. A short summary (1-2 lines)
2. Growth or risk insight
3. Recommendation for next move

Keep it concise and in bullet points.
`;
}

function buildNewsPrompt(data) {
  return `
You are a startup and industry news assistant.

Summarize this article for a founder or investor:

Title: ${data.title}
Source: ${data.source}
Published: ${data.publishedAt}
Category: ${data.category}
Description: ${data.description}

Return:
1. A short 2-3 sentence summary
2. Why it matters in one concise bullet

Keep it clear, professional, and concise.
`;
}

function buildAdminUsersPrompt(data) {
  return `
You are an admin operations analyst.

Review this user management summary:

Total users: ${data.totalUsers}
Founders: ${data.founders}
Investors: ${data.investors}
Suspended users: ${data.suspendedUsers}
Gender breakdown: ${data.genderBreakdown}
Age ratio: ${data.ageRatio}
Recent join trend: ${data.joinTrend}

Return:
1. A concise 2-3 sentence executive summary
2. Risk alerts as bullet points
3. A short recommended next action list
`;
}

function buildAdminTransactionsPrompt(data) {
  return `
You are an admin finance operations analyst.

Review this system transaction summary:

Total transactions: ${data.totalTransactions}
Total volume: ${data.totalVolume}
Load volume: ${data.loadVolume}
Investment volume: ${data.investVolume}
Exit volume: ${data.exitVolume}
Failed payments: ${data.failedPayments}
Activity trend: ${data.activityTrend}

Return:
1. A concise 2-3 sentence operational summary
2. Risk alerts as bullet points
3. A short recommendation list
`;
}

export async function generateSummary(data) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
  });

  const prompt =
    data.summaryType === "founder"
      ? buildFounderPrompt(data)
      : data.summaryType === "news"
        ? buildNewsPrompt(data)
        : data.summaryType === "admin-users"
          ? buildAdminUsersPrompt(data)
          : data.summaryType === "admin-transactions"
            ? buildAdminTransactionsPrompt(data)
        : buildInvestorPrompt(data);

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  return response;
}
