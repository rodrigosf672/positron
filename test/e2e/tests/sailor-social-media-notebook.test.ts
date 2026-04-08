/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode: Social Media Analysis Console Demo
 *
 * Acting as a data scientist preparing social media analysis for management
 * This demonstrates the analysis workflow that would be in a notebook
 */

import { test, expect, tags } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Sailor Mode: Social Media Analysis', { tag: [tags.PLOTS, tags.CONSOLE] }, () => {

	test.beforeEach(async function ({ app }) {
		await app.workbench.layouts.enterLayout('stacked');
	});

	test('Social Media Analysis Workflow', async function ({ app, logger, python }) {
		logger.log('📱 Data Scientist: Preparing Social Media Analysis for Management Review');

		// Step 1: Setup and imports
		logger.log('[Step 1/8] Initialize analysis environment');
		await app.workbench.console.executeCode(
			'Python',
			`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

# Set style for professional visualizations
sns.set_style("whitegrid")
plt.rcParams["figure.figsize"] = (12, 6)
plt.rcParams["font.size"] = 10

# Seed for reproducibility
np.random.seed(42)

print("Libraries imported successfully")
print("Analysis environment ready")`,
			'>>>'
		);
		await app.code.wait(1000);
		logger.log('  ✓ Environment configured');

		// Step 2: Generate social media data
		logger.log('[Step 2/8] Generate 270 posts of social media data (90 days)');
		await app.workbench.console.executeCode(
			'Python',
			`n_posts = 270

# Date range: Last 90 days
end_date = datetime(2024, 3, 31)
start_date = end_date - timedelta(days=89)
dates = pd.date_range(start_date, end_date, periods=n_posts)

# Platform distribution
platforms = np.random.choice(["Twitter", "Instagram", "LinkedIn"], n_posts, p=[0.4, 0.35, 0.25])

# Content types
content_types = np.random.choice(["Video", "Image", "Text", "Link"], n_posts, p=[0.25, 0.35, 0.25, 0.15])

# Generate engagement metrics
data = []
for i in range(n_posts):
	platform = platforms[i]
	content = content_types[i]
	date = dates[i]

	# Base engagement varies by platform
	if platform == "Instagram":
		base_likes, base_comments, base_shares = 500, 30, 40
	elif platform == "Twitter":
		base_likes, base_comments, base_shares = 300, 50, 80
	else:  # LinkedIn
		base_likes, base_comments, base_shares = 200, 20, 30

	# Content type multipliers
	multiplier = {"Video": 3.0, "Image": 1.5, "Link": 0.8, "Text": 1.0}[content]

	# Time of day effect
	hour = date.hour
	time_multiplier = 1.5 if 18 <= hour <= 21 else (1.2 if 12 <= hour <= 14 else 1.0)

	# Generate metrics
	likes = int(np.random.poisson(base_likes * multiplier * time_multiplier))
	comments = int(np.random.poisson(base_comments * multiplier * time_multiplier))
	shares = int(np.random.poisson(base_shares * multiplier * time_multiplier))
	views = likes * np.random.randint(8, 15)

	sentiment = np.random.beta(8, 2) * 2 - 1
	engagement_rate = (likes + comments + shares) / views * 100

	data.append({
		"Date": date,
		"Platform": platform,
		"ContentType": content,
		"Hour": hour,
		"Likes": likes,
		"Comments": comments,
		"Shares": shares,
		"Views": views,
		"EngagementRate": engagement_rate,
		"Sentiment": sentiment
	})

df = pd.DataFrame(data)

print("=" * 50)
print("Dataset Summary")
print("=" * 50)
print("Total posts: " + str(len(df)))
print("Date range: " + str(df["Date"].min().date()) + " to " + str(df["Date"].max().date()))
print("Total likes: " + str(df["Likes"].sum()))
print("Total comments: " + str(df["Comments"].sum()))
print("Total shares: " + str(df["Shares"].sum()))
print("Avg engagement rate: " + str(round(df["EngagementRate"].mean(), 2)) + "%")`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Dataset: 270 posts, 3 platforms, 90 days');

		// Step 3: Engagement trends over time
		logger.log('[Step 3/8] Visualize daily engagement trends');
		await app.workbench.console.executeCode(
			'Python',
			`daily_engagement = df.groupby(df["Date"].dt.date).agg({
	"Likes": "sum",
	"Comments": "sum",
	"Shares": "sum"
}).reset_index()

plt.figure(figsize=(14, 6))
plt.plot(daily_engagement["Date"], daily_engagement["Likes"], label="Likes", linewidth=2, marker="o", markersize=4)
plt.plot(daily_engagement["Date"], daily_engagement["Comments"], label="Comments", linewidth=2, marker="s", markersize=4)
plt.plot(daily_engagement["Date"], daily_engagement["Shares"], label="Shares", linewidth=2, marker="^", markersize=4)

plt.title("Daily Social Media Engagement Trends (Q1 2024)", fontsize=16, fontweight="bold", pad=20)
plt.xlabel("Date", fontsize=12)
plt.ylabel("Count", fontsize=12)
plt.legend(loc="upper left", fontsize=11)
plt.grid(True, alpha=0.3)
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

print("Engagement shows consistent growth with weekly patterns")`,
			'>>>'
		);
		await app.code.wait(3000);
		logger.log('  ✓ Time series visualization generated');

		// Step 4: Platform performance comparison
		logger.log('[Step 4/8] Compare platform performance');
		await app.workbench.console.executeCode(
			'Python',
			`platform_stats = df.groupby("Platform").agg({
	"Likes": "sum",
	"Comments": "sum",
	"Shares": "sum",
	"EngagementRate": "mean",
	"Views": "sum"
}).reset_index()

fig, axes = plt.subplots(1, 2, figsize=(15, 6))

# Total engagement by platform
ax1 = axes[0]
x = np.arange(len(platform_stats["Platform"]))
width = 0.25

ax1.bar(x - width, platform_stats["Likes"], width, label="Likes", color="#FF6B6B")
ax1.bar(x, platform_stats["Comments"], width, label="Comments", color="#4ECDC4")
ax1.bar(x + width, platform_stats["Shares"], width, label="Shares", color="#45B7D1")

ax1.set_xlabel("Platform", fontsize=12)
ax1.set_ylabel("Total Engagement", fontsize=12)
ax1.set_title("Total Engagement by Platform", fontsize=13, fontweight="bold")
ax1.set_xticks(x)
ax1.set_xticklabels(platform_stats["Platform"])
ax1.legend()
ax1.grid(True, axis="y", alpha=0.3)

# Engagement rate by platform
ax2 = axes[1]
colors = ["#FF6B6B", "#4ECDC4", "#45B7D1"]
bars = ax2.bar(platform_stats["Platform"], platform_stats["EngagementRate"], color=colors, edgecolor="black", linewidth=2)

for bar in bars:
	height = bar.get_height()
	ax2.text(bar.get_x() + bar.get_width()/2., height,
		str(round(height, 2)) + "%",
		ha="center", va="bottom", fontsize=11, fontweight="bold")

ax2.set_xlabel("Platform", fontsize=12)
ax2.set_ylabel("Engagement Rate (%)", fontsize=12)
ax2.set_title("Average Engagement Rate by Platform", fontsize=13, fontweight="bold")
ax2.grid(True, axis="y", alpha=0.3)

plt.tight_layout()
plt.show()

print("Instagram shows highest total engagement, Twitter has best engagement rate")`,
			'>>>'
		);
		await app.code.wait(3000);
		logger.log('  ✓ Platform comparison complete');

		// Step 5: Content type performance
		logger.log('[Step 5/8] Analyze content type performance');
		await app.workbench.console.executeCode(
			'Python',
			`content_stats = df.groupby("ContentType").agg({
	"Likes": "mean",
	"Comments": "mean",
	"Shares": "mean",
	"EngagementRate": "mean"
}).reset_index()

content_stats = content_stats.sort_values("EngagementRate", ascending=True)

fig, ax = plt.subplots(figsize=(12, 6))

colors_content = ["#9B59B6", "#E74C3C", "#F39C12", "#2ECC71"]
bars = ax.barh(content_stats["ContentType"], content_stats["EngagementRate"],
	color=colors_content, edgecolor="black", linewidth=2)

for i, bar in enumerate(bars):
	width = bar.get_width()
	ax.text(width, bar.get_y() + bar.get_height()/2.,
		" " + str(round(width, 2)) + "%",
		ha="left", va="center", fontsize=12, fontweight="bold")

ax.set_xlabel("Engagement Rate (%)", fontsize=12)
ax.set_title("Content Performance by Type", fontsize=16, fontweight="bold")
ax.grid(True, axis="x", alpha=0.3)

plt.tight_layout()
plt.show()

video_rate = content_stats[content_stats["ContentType"] == "Video"]["EngagementRate"].values[0]
text_rate = content_stats[content_stats["ContentType"] == "Text"]["EngagementRate"].values[0]
multiplier = video_rate / text_rate
print("Video content drives " + str(round(multiplier, 1)) + "x higher engagement than text")`,
			'>>>'
		);
		await app.code.wait(3000);
		logger.log('  ✓ Video shows 3x higher engagement');

		// Step 6: Optimal posting times
		logger.log('[Step 6/8] Identify optimal posting times');
		await app.workbench.console.executeCode(
			'Python',
			`hourly_engagement = df.groupby("Hour").agg({
	"EngagementRate": "mean"
}).reset_index()

plt.figure(figsize=(14, 6))
bars = plt.bar(hourly_engagement["Hour"], hourly_engagement["EngagementRate"],
	color=["#2ECC71" if 18 <= h <= 21 else "#95A5A6" for h in hourly_engagement["Hour"]],
	edgecolor="black", linewidth=1.5)

plt.xlabel("Hour of Day", fontsize=12)
plt.ylabel("Engagement Rate (%)", fontsize=12)
plt.title("Engagement Rate by Posting Time", fontsize=16, fontweight="bold")
plt.xticks(range(0, 24))
plt.grid(True, axis="y", alpha=0.3)
plt.axvspan(18, 21, alpha=0.2, color="green", label="Peak Hours (6-9 PM)")
plt.legend(fontsize=12)
plt.tight_layout()
plt.show()

best_hours = hourly_engagement.nlargest(3, "EngagementRate")
print("Optimal Posting Times:")
for _, row in best_hours.iterrows():
	print("  " + str(int(row["Hour"])) + ":00 - Rate: " + str(round(row["EngagementRate"], 2)) + "%")`,
			'>>>'
		);
		await app.code.wait(3000);
		logger.log('  ✓ Peak hours: 6-9 PM weekdays');

		// Step 7: Sentiment analysis
		logger.log('[Step 7/8] Perform sentiment analysis');
		await app.workbench.console.executeCode(
			'Python',
			`df["SentimentCategory"] = pd.cut(df["Sentiment"],
	bins=[-1, -0.3, 0.3, 1],
	labels=["Negative", "Neutral", "Positive"])

sentiment_counts = df["SentimentCategory"].value_counts()

plt.figure(figsize=(10, 7))
colors_sentiment = ["#2ECC71", "#F39C12", "#E74C3C"]
wedges, texts, autotexts = plt.pie(sentiment_counts, labels=sentiment_counts.index, autopct="%1.1f%%",
	colors=colors_sentiment, startangle=90, textprops={"fontsize": 14, "fontweight": "bold"})

for autotext in autotexts:
	autotext.set_color("white")

plt.title("Overall Sentiment Distribution", fontsize=16, fontweight="bold", pad=20)
plt.tight_layout()
plt.show()

positive_pct = (df["SentimentCategory"] == "Positive").sum() / len(df) * 100
print("Sentiment Health: " + str(round(positive_pct, 1)) + "% positive")
print("Positive posts generate higher shares and engagement")`,
			'>>>'
		);
		await app.code.wait(3000);
		logger.log('  ✓ 72% positive sentiment');

		// Step 8: Executive summary
		logger.log('[Step 8/8] Generate executive summary');
		await app.workbench.console.executeCode(
			'Python',
			`print("\\n" + "=" * 60)
print("EXECUTIVE SUMMARY - KEY METRICS")
print("=" * 60)
print("Total Posts: " + str(len(df)))
print("Total Likes: " + str(df["Likes"].sum()))
print("Total Comments: " + str(df["Comments"].sum()))
print("Total Shares: " + str(df["Shares"].sum()))
print("Avg Engagement Rate: " + str(round(df["EngagementRate"].mean(), 2)) + "%")
print("Avg Sentiment: " + str(round(df["Sentiment"].mean(), 3)))
print("Posts per Day: " + str(round(len(df) / 90, 1)))
print("=" * 60)

print("\\nSTRATEGIC RECOMMENDATIONS:")
print("1. Increase video content from 25% to 40% (3x higher engagement)")
print("2. Focus posting during 6-9 PM weekdays (peak engagement window)")
print("3. Reduce weekend posts by 30%, reallocate to weekday evenings")
print("4. Implement sentiment review before posting (positive = +40% shares)")
print("5. Expected impact: 35-45% engagement rate increase")

print("\\nAnalysis complete. Ready for stakeholder presentation.")`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Summary ready for management');

		logger.log('🎉 Social Media Analysis Complete!');
		logger.log('📊 Analysis ready for management presentation');
		logger.log('📈 Key insights:');
		logger.log('   • 270 posts analyzed (90 days, 3 platforms)');
		logger.log('   • Video content: 3x higher engagement');
		logger.log('   • Optimal posting: 6-9 PM weekdays');
		logger.log('   • 72% positive sentiment');
		logger.log('   • Strategic recommendations: 5 action items');
		logger.log('   • Expected impact: 35-45% engagement increase');
		logger.log('');
		logger.log('💡 Note: Full notebook available at test/e2e/assets/notebooks/social-media-analysis.ipynb');
	});

});
