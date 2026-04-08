/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode: Pharmaceutical Data Analysis
 *
 * Acting as a pharmacist analyzing clinical trial data for drug efficacy and safety
 */

import { test, expect, tags } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Sailor Mode: Pharmaceutical Analysis', { tag: [tags.PLOTS, tags.CONSOLE] }, () => {

	test.beforeEach(async function ({ app }) {
		await app.workbench.layouts.enterLayout('stacked');
	});

	test('Clinical Trial Drug Analysis Workflow', async function ({ app, logger, python }) {
		logger.log('💊 Pharmacist: Analyzing Clinical Trial Results');

		// Step 1: Generate clinical trial data
		logger.log('[Step 1/8] Generate clinical trial dataset');
		await app.workbench.console.executeCode(
			'Python',
			`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

# Seed for reproducibility
np.random.seed(789)

# Clinical trial setup
drugs = ['DrugA', 'DrugB', 'DrugC', 'Placebo']
n_patients_per_drug = 150
dosages = [10, 20, 40]  # mg

# Generate patient data
trial_data = []
patient_id = 1

for drug in drugs:
	for _ in range(n_patients_per_drug):
		# Patient demographics
		age = np.random.normal(55, 15)
		age = max(18, min(85, age))  # Age between 18-85
		weight = np.random.normal(75, 15)  # kg

		# Baseline severity (1-10 scale)
		baseline = np.random.uniform(6, 9)

		# Drug efficacy (improvement in symptoms)
		if drug == 'Placebo':
			efficacy = np.random.normal(1.5, 0.8)  # Placebo effect
		elif drug == 'DrugA':
			efficacy = np.random.normal(3.2, 1.0)  # Moderate efficacy
		elif drug == 'DrugB':
			efficacy = np.random.normal(4.5, 1.2)  # High efficacy
		else:  # DrugC
			efficacy = np.random.normal(2.8, 1.1)  # Lower efficacy

		efficacy = max(0, min(baseline, efficacy))  # Can't improve more than baseline
		final_score = baseline - efficacy

		# Side effects (probability based on drug)
		side_effect_probs = {
			'Placebo': 0.15,
			'DrugA': 0.25,
			'DrugB': 0.40,
			'DrugC': 0.20
		}
		has_side_effect = np.random.random() < side_effect_probs[drug]

		# Dosage (for actual drugs)
		dosage = np.random.choice(dosages) if drug != 'Placebo' else 0

		trial_data.append({
			'PatientID': patient_id,
			'Drug': drug,
			'Age': age,
			'Weight': weight,
			'BaselineSeverity': baseline,
			'FinalSeverity': final_score,
			'Improvement': efficacy,
			'Dosage': dosage,
			'SideEffect': has_side_effect
		})
		patient_id += 1

df = pd.DataFrame(trial_data)
print("Clinical trial dataset: " + str(len(df)) + " patients across " + str(len(drugs)) + " treatment groups")
print("")
print("Patients per drug: " + str(n_patients_per_drug))
print("Age range: " + str(round(df["Age"].min(), 1)) + " - " + str(round(df["Age"].max(), 1)) + " years")`,
			'>>>'
		);
		await app.code.wait(1000);
		logger.log('  ✓ Clinical trial data generated');

		// Step 2: Efficacy comparison
		logger.log('[Step 2/8] Compare drug efficacy');
		await app.workbench.console.executeCode(
			'Python',
			`plt.figure(figsize=(12, 6))

# Box plot for efficacy comparison
drug_order = ['Placebo', 'DrugC', 'DrugA', 'DrugB']
data_to_plot = [df[df['Drug'] == drug]['Improvement'].values for drug in drug_order]

bp = plt.boxplot(data_to_plot, labels=drug_order, patch_artist=True)

# Color the boxes
colors = ['#d3d3d3', '#ffcccc', '#ffeeaa', '#aaffaa']
for patch, color in zip(bp['boxes'], colors):
	patch.set_facecolor(color)

# Add mean markers
means = [df[df['Drug'] == drug]['Improvement'].mean() for drug in drug_order]
plt.plot(range(1, len(drug_order) + 1), means, 'r*', markersize=15, label='Mean')

plt.title('Drug Efficacy Comparison (Symptom Improvement)', fontsize=16, fontweight='bold')
plt.ylabel('Improvement Score (points)', fontsize=12)
plt.xlabel('Treatment Group', fontsize=12)
plt.grid(True, axis='y', alpha=0.3)
plt.legend()
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.workbench.plots.waitForCurrentPlot();
		logger.log('  ✓ Efficacy comparison displayed');

		// Step 3: Statistical significance testing
		logger.log('[Step 3/8] Perform statistical analysis');
		await app.workbench.console.executeCode(
			'Python',
			`# Perform t-tests comparing each drug to placebo
print("\\n" + "="*60)
print("STATISTICAL ANALYSIS: Drug vs Placebo")
print("="*60)

placebo_improvement = df[df['Drug'] == 'Placebo']['Improvement'].values

for drug in ['DrugA', 'DrugB', 'DrugC']:
	drug_improvement = df[df['Drug'] == drug]['Improvement'].values
	t_stat, p_value = stats.ttest_ind(drug_improvement, placebo_improvement)

	mean_drug = drug_improvement.mean()
	mean_placebo = placebo_improvement.mean()
	difference = mean_drug - mean_placebo

	print(f"\\n{drug}:")
	print(f"  Mean improvement: {mean_drug:.2f} points")
	print(f"  Placebo mean: {mean_placebo:.2f} points")
	print(f"  Difference: {difference:.2f} points")
	print(f"  t-statistic: {t_stat:.3f}")
	print(f"  p-value: {p_value:.4f}")

	if p_value < 0.001:
		sig = "*** (highly significant)"
	elif p_value < 0.01:
		sig = "** (very significant)"
	elif p_value < 0.05:
		sig = "* (significant)"
	else:
		sig = "(not significant)"
	print(f"  Significance: {sig}")

print("="*60)`,
			'>>>'
		);
		logger.log('  ✓ Statistical tests completed');

		// Step 4: Dosage-response analysis
		logger.log('[Step 4/8] Analyze dosage-response relationship');
		await app.workbench.console.executeCode(
			'Python',
			`fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Analyze each drug separately
drugs_to_analyze = ['DrugA', 'DrugB', 'DrugC']

for idx, drug in enumerate(drugs_to_analyze):
	ax = axes[idx]
	drug_data = df[df['Drug'] == drug]

	# Group by dosage
	dosage_groups = drug_data.groupby('Dosage')['Improvement'].agg(['mean', 'std', 'count'])

	# Plot with error bars
	x = dosage_groups.index
	y = dosage_groups['mean']
	yerr = dosage_groups['std'] / np.sqrt(dosage_groups['count'])  # Standard error

	ax.errorbar(x, y, yerr=yerr, marker='o', markersize=10, capsize=5, linewidth=2, label='Mean ± SE')
	ax.scatter(drug_data['Dosage'], drug_data['Improvement'], alpha=0.3, s=30, label='Individual patients')

	ax.set_title(f'{drug} Dosage-Response', fontsize=12, fontweight='bold')
	ax.set_xlabel('Dosage (mg)', fontsize=10)
	ax.set_ylabel('Improvement (points)', fontsize=10)
	ax.grid(True, alpha=0.3)
	ax.legend(fontsize=8)
	ax.set_xticks([10, 20, 40])

plt.suptitle('Dosage-Response Analysis', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Dosage-response analysis complete');

		// Step 5: Side effects analysis
		logger.log('[Step 5/8] Analyze side effect profiles');
		await app.workbench.console.executeCode(
			'Python',
			`# Calculate side effect rates
side_effect_data = df.groupby('Drug')['SideEffect'].agg(['sum', 'count'])
side_effect_data['rate'] = (side_effect_data['sum'] / side_effect_data['count']) * 100

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Bar chart of side effect rates
colors_se = ['#90EE90', '#FFD700', '#FFA500', '#D3D3D3']
bars = ax1.bar(side_effect_data.index, side_effect_data['rate'], color=colors_se, edgecolor='black', linewidth=2)

# Add percentage labels
for bar in bars:
	height = bar.get_height()
	label_text = f"{height:.1f}%"
	ax1.text(bar.get_x() + bar.get_width()/2., height,
		label_text,
		ha='center', va='bottom', fontsize=11, fontweight='bold')

ax1.set_title('Side Effect Incidence Rate', fontsize=13, fontweight='bold')
ax1.set_ylabel('Patients with Side Effects (%)', fontsize=11)
ax1.set_xlabel('Drug', fontsize=11)
ax1.grid(True, axis='y', alpha=0.3)
ax1.set_ylim(0, max(side_effect_data['rate']) * 1.2)

# Risk-benefit scatter plot
efficacy_means = df.groupby('Drug')['Improvement'].mean()
risk_benefit = pd.DataFrame({
	'Efficacy': efficacy_means,
	'SideEffectRate': side_effect_data['rate']
})

for drug in risk_benefit.index:
	x = risk_benefit.loc[drug, 'SideEffectRate']
	y = risk_benefit.loc[drug, 'Efficacy']
	ax2.scatter(x, y, s=300, alpha=0.6, label=drug)
	ax2.annotate(drug, (x, y), fontsize=10, fontweight='bold', ha='center', va='center')

ax2.set_title('Risk-Benefit Profile', fontsize=13, fontweight='bold')
ax2.set_xlabel('Side Effect Rate (%)', fontsize=11)
ax2.set_ylabel('Mean Efficacy (improvement points)', fontsize=11)
ax2.grid(True, alpha=0.3)
ax2.axhline(y=efficacy_means['Placebo'], color='red', linestyle='--', linewidth=2, label='Placebo baseline')

plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Side effect analysis complete');

		// Step 6: Patient demographics
		logger.log('[Step 6/8] Analyze patient demographics');
		await app.workbench.console.executeCode(
			'Python',
			`fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Age distribution by drug
ax1 = axes[0, 0]
for drug in drugs:
	drug_ages = df[df['Drug'] == drug]['Age']
	ax1.hist(drug_ages, bins=15, alpha=0.5, label=drug, edgecolor='black')
ax1.set_title('Age Distribution by Treatment Group', fontsize=12, fontweight='bold')
ax1.set_xlabel('Age (years)', fontsize=10)
ax1.set_ylabel('Number of Patients', fontsize=10)
ax1.legend()
ax1.grid(True, alpha=0.3)

# Improvement vs Age
ax2 = axes[0, 1]
for drug in drugs:
	drug_data = df[df['Drug'] == drug]
	ax2.scatter(drug_data['Age'], drug_data['Improvement'], alpha=0.4, s=40, label=drug)
ax2.set_title('Efficacy vs Patient Age', fontsize=12, fontweight='bold')
ax2.set_xlabel('Age (years)', fontsize=10)
ax2.set_ylabel('Improvement (points)', fontsize=10)
ax2.legend()
ax2.grid(True, alpha=0.3)

# Weight distribution
ax3 = axes[1, 0]
weight_data = [df[df['Drug'] == drug]['Weight'].values for drug in drugs]
bp = ax3.boxplot(weight_data, labels=drugs, patch_artist=True)
for patch in bp['boxes']:
	patch.set_facecolor('#ADD8E6')
ax3.set_title('Patient Weight Distribution', fontsize=12, fontweight='bold')
ax3.set_xlabel('Drug', fontsize=10)
ax3.set_ylabel('Weight (kg)', fontsize=10)
ax3.grid(True, axis='y', alpha=0.3)

# Baseline vs Final severity
ax4 = axes[1, 1]
for drug in drugs:
	drug_data = df[df['Drug'] == drug]
	ax4.scatter(drug_data['BaselineSeverity'], drug_data['FinalSeverity'], alpha=0.4, s=40, label=drug)
# Add line of no change
ax4.plot([6, 9], [6, 9], 'k--', linewidth=2, label='No change')
ax4.set_title('Baseline vs Final Severity', fontsize=12, fontweight='bold')
ax4.set_xlabel('Baseline Severity', fontsize=10)
ax4.set_ylabel('Final Severity', fontsize=10)
ax4.legend()
ax4.grid(True, alpha=0.3)

plt.suptitle('Patient Demographics and Response', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Demographics analysis complete');

		// Step 7: Success rate analysis
		logger.log('[Step 7/8] Calculate treatment success rates');
		await app.workbench.console.executeCode(
			'Python',
			`# Define success as improvement >= 3 points
df['Success'] = df['Improvement'] >= 3.0

success_rates = df.groupby('Drug')['Success'].agg(['sum', 'count'])
success_rates['rate'] = (success_rates['sum'] / success_rates['count']) * 100

plt.figure(figsize=(10, 7))

# Create stacked bar chart
success_counts = success_rates['sum']
failure_counts = success_rates['count'] - success_rates['sum']

x_pos = np.arange(len(drugs))
p1 = plt.bar(x_pos, success_counts, color='#2ecc71', label='Success (≥3 points improvement)')
p2 = plt.bar(x_pos, failure_counts, bottom=success_counts, color='#e74c3c', label='No significant improvement')

plt.xticks(x_pos, drugs)
plt.ylabel('Number of Patients', fontsize=12)
plt.title('Treatment Success Rates\\n(Success = ≥3 points improvement)', fontsize=14, fontweight='bold')
plt.legend(loc='upper right')
plt.grid(True, axis='y', alpha=0.3)

# Add percentage labels
for i, drug in enumerate(drugs):
	total = success_rates.loc[drug, 'count']
	rate = success_rates.loc[drug, 'rate']
	plt.text(i, total/2, f'{rate:.1f}%', ha='center', va='center',
		fontsize=14, fontweight='bold', color='white')

plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('  ✓ Success rate analysis complete');

		// Step 8: Clinical summary
		logger.log('[Step 8/8] Generate clinical recommendations');
		await app.workbench.console.executeCode(
			'Python',
			`print("\\n" + "="*70)
print("CLINICAL TRIAL SUMMARY - PHARMACIST RECOMMENDATIONS")
print("="*70)

print("\\n📊 EFFICACY RANKINGS:")
efficacy_ranking = df.groupby('Drug')['Improvement'].mean().sort_values(ascending=False)
for i, (drug, score) in enumerate(efficacy_ranking.items(), 1):
	print(f"  {i}. {drug}: {score:.2f} points improvement (mean)")

print("\\n⚠️  SIDE EFFECT PROFILE:")
se_ranking = df.groupby('Drug')['SideEffect'].mean().sort_values() * 100
for drug, rate in se_ranking.items():
	print(f"  {drug}: {rate:.1f}% incidence rate")

print("\\n✅ SUCCESS RATES (≥3 points improvement):")
for drug in efficacy_ranking.index:
	rate = success_rates.loc[drug, 'rate']
	count = success_rates.loc[drug, 'sum']
	total = success_rates.loc[drug, 'count']
	print(f"  {drug}: {rate:.1f}% ({int(count)}/{int(total)} patients)")

print("\\n💊 RECOMMENDED TREATMENT APPROACH:")
best_efficacy = efficacy_ranking.index[0]
best_safety = se_ranking.index[0]

if best_efficacy == 'Placebo':
	print("  ⚠️  WARNING: No drug showed substantially better results than placebo")
else:
	best_drug_efficacy = efficacy_ranking.iloc[0]
	placebo_efficacy = efficacy_ranking['Placebo']

	if best_drug_efficacy > placebo_efficacy + 1.0:
		print(f"  1st line: {best_efficacy} - highest efficacy ({best_drug_efficacy:.2f} points)")
		print(f"     Note: {df[df['Drug']==best_efficacy]['SideEffect'].mean()*100:.1f}% side effect rate")

		# Second line recommendation
		efficacy_no_placebo = efficacy_ranking.drop('Placebo')
		if len(efficacy_no_placebo) > 1:
			second_best = efficacy_no_placebo.index[1]
			print(f"  2nd line: {second_best} - alternative if side effects occur")
	else:
		print(f"  ⚠️  Marginal benefit over placebo - consider non-pharmacological approaches")

print("\\n📋 PATIENT COUNSELING POINTS:")
print(f"  • Expected improvement: {efficacy_ranking[best_efficacy]:.1f} points on severity scale")
print(f"  • Onset: Results measured over trial period")
print(f"  • Side effects: Monitor patients, especially in first 2 weeks")
print(f"  • Age consideration: No significant age-related efficacy differences observed")

print("\\n" + "="*70)
print("⚕️  Analysis complete - Data-driven prescribing decision support")
print("="*70)`,
			'>>>'
		);
		logger.log('  ✓ Clinical recommendations generated');

		logger.log('🎉 Pharmaceutical Analysis Complete!');
		logger.log('📊 Generated 7 comprehensive visualizations:');
		logger.log('   1. Box Plot - Drug efficacy comparison');
		logger.log('   2. Dosage-Response Curves - Three drugs analyzed');
		logger.log('   3. Side Effect Profiles - Incidence rates & risk-benefit');
		logger.log('   4. Demographics Dashboard - Age, weight, baseline analysis');
		logger.log('   5. Success Rates - Stacked bar chart with outcomes');
		logger.log('   6. Statistical Testing - p-values vs placebo');
		logger.log('   7. Clinical Recommendations - Evidence-based prescribing');
	});

});
