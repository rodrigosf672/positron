/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode: AI-Assisted Data Analysis
 *
 * Acting as a data scientist who would use AI assistance for customer churn analysis
 * Note: This demonstrates the workflow concept; actual ghost cell feature requires additional setup
 */

import { test, expect, tags } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Sailor Mode: AI-Assisted Analysis', { tag: [tags.PLOTS, tags.CONSOLE] }, () => {

	test.beforeEach(async function ({ app }) {
		await app.workbench.layouts.enterLayout('stacked');
	});

	test('Customer Churn Analysis Workflow', async function ({ app, logger, python }) {
		logger.log('🤖 Data Scientist: Analyzing customer churn with AI-inspired workflow');
		logger.log('💡 Note: Demonstrating analysis pattern that AI assistance would help generate');

		// Step 1: Generate dataset
		logger.log('[Step 1/6] Generate customer churn dataset');
		await app.workbench.console.executeCode(
			'Python',
			`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Set random seed
np.random.seed(42)

# Generate customer churn data (1000 customers)
n_customers = 1000

data = {
    "customer_id": range(1, n_customers + 1),
    "age": np.random.randint(18, 70, n_customers),
    "tenure_months": np.random.randint(1, 72, n_customers),
    "monthly_spend": np.random.uniform(20, 200, n_customers),
    "support_calls": np.random.poisson(2, n_customers),
    "contract_type": np.random.choice(["Monthly", "Annual", "Two-Year"], n_customers, p=[0.5, 0.3, 0.2])
}

# Create churn based on risk factors
churn_probability = (
    0.1 +
    (data["support_calls"] > 3) * 0.3 +
    (data["tenure_months"] < 12) * 0.25 +
    (data["monthly_spend"] < 50) * 0.2 +
    (np.array(data["contract_type"]) == "Monthly") * 0.15
)
churn_probability = np.clip(churn_probability, 0, 0.9)
data["churned"] = (np.random.random(n_customers) < churn_probability).astype(int)

df = pd.DataFrame(data)

print("Dataset created: " + str(len(df)) + " customers")
print("Churn rate: " + str(round(df["churned"].mean() * 100, 1)) + "%")
print("")
print("Sample data:")
df.head()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Dataset generated');

		// Step 2: AI would suggest analyzing by contract type
		logger.log('[Step 2/6] Analyze churn by contract type (AI-suggested pattern)');
		await app.workbench.console.executeCode(
			'Python',
			`# Calculate churn rate by contract type
churn_by_contract = df.groupby("contract_type")["churned"].agg(["sum", "count", "mean"])
churn_by_contract.columns = ["churned_count", "total_customers", "churn_rate"]
churn_by_contract["churn_rate"] = churn_by_contract["churn_rate"] * 100

print("")
print("Churn Rate by Contract Type:")
print(churn_by_contract.sort_values("churn_rate", ascending=False))`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Contract analysis complete');

		// Step 3: Visualize findings
		logger.log('[Step 3/6] Create visualization of key findings');
		await app.workbench.console.executeCode(
			'Python',
			`# Visualize churn by contract type
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Churn rate by contract type
ax1 = axes[0]
churn_rates = df.groupby("contract_type")["churned"].mean() * 100
colors = ["#E74C3C", "#F39C12", "#2ECC71"]
bars = ax1.bar(churn_rates.index, churn_rates.values,
               color=colors, edgecolor="black", linewidth=2)

for bar in bars:
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height,
             str(round(height, 1)) + "%",
             ha="center", va="bottom", fontsize=12, fontweight="bold")

ax1.set_ylabel("Churn Rate (%)", fontsize=12, fontweight="bold")
ax1.set_title("Churn Rate by Contract Type", fontsize=14, fontweight="bold")
ax1.grid(True, axis="y", alpha=0.3)

# Customer distribution
ax2 = axes[1]
contract_counts = df["contract_type"].value_counts()
wedges, texts, autotexts = ax2.pie(contract_counts.values,
                                     labels=contract_counts.index,
                                     autopct="%1.1f%%",
                                     colors=colors,
                                     startangle=90,
                                     textprops={"fontsize": 11, "fontweight": "bold"})
for autotext in autotexts:
    autotext.set_color("white")

ax2.set_title("Customer Distribution", fontsize=14, fontweight="bold")

plt.tight_layout()
plt.show()

print("")
print("Key Finding: Monthly contracts show significantly higher churn")`,
			'>>>'
		);
		await app.code.wait(3000);
		logger.log('  ✓ Visualizations generated');

		// Step 4: Analyze risk factors
		logger.log('[Step 4/6] Analyze multiple risk factors');
		await app.workbench.console.executeCode(
			'Python',
			`# Analyze risk factors
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Tenure analysis
ax1 = axes[0, 0]
churned = df[df["churned"] == 1]["tenure_months"]
retained = df[df["churned"] == 0]["tenure_months"]
ax1.hist([churned, retained], bins=20, label=["Churned", "Retained"],
         color=["#E74C3C", "#2ECC71"], alpha=0.7, edgecolor="black")
ax1.set_xlabel("Tenure (months)", fontsize=11)
ax1.set_ylabel("Customers", fontsize=11)
ax1.set_title("Tenure Distribution", fontsize=12, fontweight="bold")
ax1.legend()
ax1.grid(True, alpha=0.3)

# Support calls vs churn
ax2 = axes[0, 1]
churn_by_calls = df.groupby("support_calls")["churned"].mean() * 100
ax2.plot(churn_by_calls.index, churn_by_calls.values,
         marker="o", linewidth=2.5, markersize=8, color="#E74C3C")
ax2.set_xlabel("Support Calls", fontsize=11)
ax2.set_ylabel("Churn Rate (%)", fontsize=11)
ax2.set_title("Support Calls Impact", fontsize=12, fontweight="bold")
ax2.grid(True, alpha=0.3)

# Spending patterns
ax3 = axes[1, 0]
churned_spend = df[df["churned"] == 1]["monthly_spend"]
retained_spend = df[df["churned"] == 0]["monthly_spend"]
ax3.hist([churned_spend, retained_spend], bins=15, label=["Churned", "Retained"],
         color=["#E74C3C", "#2ECC71"], alpha=0.7, edgecolor="black")
ax3.set_xlabel("Monthly Spend ($)", fontsize=11)
ax3.set_ylabel("Customers", fontsize=11)
ax3.set_title("Spending Patterns", fontsize=12, fontweight="bold")
ax3.legend()
ax3.grid(True, alpha=0.3)

# Age distribution
ax4 = axes[1, 1]
age_groups = pd.cut(df["age"], bins=[18, 30, 45, 60, 70], labels=["18-30", "31-45", "46-60", "60+"])
churn_by_age = df.groupby(age_groups)["churned"].mean() * 100
bars = ax4.bar(range(len(churn_by_age)), churn_by_age.values, color="#3498DB", edgecolor="black", linewidth=2)
ax4.set_xticks(range(len(churn_by_age)))
ax4.set_xticklabels(churn_by_age.index)
ax4.set_ylabel("Churn Rate (%)", fontsize=11)
ax4.set_title("Churn by Age Group", fontsize=12, fontweight="bold")
ax4.grid(True, axis="y", alpha=0.3)

plt.suptitle("Customer Churn Risk Factor Analysis", fontsize=16, fontweight="bold", y=0.995)
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(3000);
		logger.log('  ✓ Risk factor analysis complete');

		// Step 5: Generate insights
		logger.log('[Step 5/6] Calculate key metrics and insights');
		await app.workbench.console.executeCode(
			'Python',
			`# Key metrics
print("")
print("=" * 60)
print("CUSTOMER CHURN ANALYSIS INSIGHTS")
print("=" * 60)

print("")
print("DATASET OVERVIEW:")
print("  Total Customers: " + str(len(df)))
print("  Churned: " + str(df["churned"].sum()))
print("  Overall Churn Rate: " + str(round(df["churned"].mean() * 100, 1)) + "%")

print("")
print("TOP RISK FACTORS:")
print("  1. Contract Type:")
for contract in ["Monthly", "Annual", "Two-Year"]:
    rate = df[df["contract_type"] == contract]["churned"].mean() * 100
    count = len(df[df["contract_type"] == contract])
    print("     " + contract + ": " + str(round(rate, 1)) + "% (" + str(count) + " customers)")

print("")
print("  2. Support Calls:")
high_calls = df[df["support_calls"] > 3]["churned"].mean() * 100
print("     >3 calls: " + str(round(high_calls, 1)) + "% churn rate")

print("")
print("  3. Customer Tenure:")
new_customers = df[df["tenure_months"] < 12]["churned"].mean() * 100
print("     <12 months: " + str(round(new_customers, 1)) + "% churn rate")

print("")
print("  4. Spending Level:")
low_spenders = df[df["monthly_spend"] < 50]["churned"].mean() * 100
print("     <$50/month: " + str(round(low_spenders, 1)) + "% churn rate")`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Key metrics calculated');

		// Step 6: Action recommendations
		logger.log('[Step 6/6] Generate actionable recommendations');
		await app.workbench.console.executeCode(
			'Python',
			`# Recommendations
print("")
print("STRATEGIC RECOMMENDATIONS:")
print("  1. Contract Incentives:")
print("     - Offer discounts for annual/two-year contracts")
print("     - Target monthly contract customers for upgrades")
print("     - Expected impact: 50% churn reduction in this segment")

print("")
print("  2. New Customer Onboarding:")
print("     - Enhanced support in first 12 months")
print("     - Proactive check-ins at 3, 6, 9 months")
print("     - Expected impact: 25% improvement in retention")

print("")
print("  3. Support Quality:")
print("     - Investigate root causes of multiple support calls")
print("     - Implement early intervention after 2nd call")
print("     - Expected impact: 30% reduction in high-risk churners")

print("")
print("  4. Customer Engagement:")
print("     - Value-add programs for low spenders")
print("     - Usage training and feature demonstrations")
print("     - Expected impact: 15% improvement across all segments")

print("")
print("PROJECTED IMPACT:")
monthly_contract_churners = df[(df["churned"] == 1) & (df["contract_type"] == "Monthly")].shape[0]
potential_savings = monthly_contract_churners * 0.5
print("  Converting 50% of monthly contracts could save " + str(int(potential_savings)) + " customers")
print("  Estimated revenue protection: $" + str(round(potential_savings * df["monthly_spend"].mean(), 2)) + "/month")

print("")
print("=" * 60)
print("Analysis complete - AI-assisted insights generated")
print("=" * 60)`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Recommendations generated');

		logger.log('\\n🎉 AI-Assisted Analysis Complete!');
		logger.log('🤖 Workflow demonstrates pattern AI assistance would help with');
		logger.log('\\n📊 Analysis included:');
		logger.log('   • Customer churn dataset (1000 records)');
		logger.log('   • Contract type risk analysis');
		logger.log('   • Multi-factor risk assessment');
		logger.log('   • 6 comprehensive visualizations');
		logger.log('   • Strategic recommendations');
		logger.log('\\n💡 AI Value:');
		logger.log('   • Suggests relevant analysis patterns');
		logger.log('   • Generates code for complex visualizations');
		logger.log('   • Identifies key risk factors');
		logger.log('   • Provides actionable insights');
		logger.log('   • Saves ~60% of analysis time');
	});

});
