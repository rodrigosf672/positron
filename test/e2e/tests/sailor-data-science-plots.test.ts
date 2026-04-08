/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode: Data Science Plots Exploration
 *
 * Acting as a data scientist exploring sales data with various visualizations
 */

import { test, expect, tags } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Sailor Mode: Data Science Plots', { tag: [tags.PLOTS, tags.CONSOLE] }, () => {

	test.beforeEach(async function ({ app }) {
		await app.workbench.layouts.enterLayout('stacked');
	});

	test('Sales Data Analysis Workflow', async function ({ app, logger, python }) {
		logger.log('📊 Data Scientist: Analyzing Q4 Sales Data');

		// Step 1: Generate realistic sales data
		logger.log('[Step 1/8] Generate synthetic sales data');
		await app.workbench.console.executeCode(
			'Python',
			`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Seed for reproducibility
np.random.seed(42)

# Generate Q4 sales data (Oct, Nov, Dec)
dates = pd.date_range('2023-10-01', '2023-12-31', freq='D')
n_days = len(dates)

# Product categories with different seasonality
products = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports']
sales_data = []

for product in products:
		# Base sales with trend and seasonality
		trend = np.linspace(100, 150, n_days)
		seasonal = 50 * np.sin(np.linspace(0, 2*np.pi, n_days))
		noise = np.random.normal(0, 20, n_days)

		# Holiday boost for last 2 weeks
		holiday_boost = np.where(dates >= '2023-12-15', 80, 0)

		sales = trend + seasonal + noise + holiday_boost
		sales = np.maximum(sales, 0)	# No negative sales

		for date, sale in zip(dates, sales):
				sales_data.append({
						'Date': date,
						'Product': product,
						'Sales': sale,
						'Revenue': sale * np.random.uniform(20, 100)
				})

df = pd.DataFrame(sales_data)
print(f"Generated {len(df)} sales records")`,
			'>>>'
		);
		logger.log('	✓ Sales data generated');

		// Step 2: Time series plot
		logger.log('[Step 2/8] Create time series visualization');
		await app.workbench.console.executeCode(
			'Python',
			`plt.figure(figsize=(12, 6))
for product in products:
		product_data = df[df['Product'] == product]
		plt.plot(product_data['Date'], product_data['Sales'], label=product, linewidth=2)

plt.title('Q4 Sales Trends by Product Category', fontsize=16, fontweight='bold')
plt.xlabel('Date', fontsize=12)
plt.ylabel('Daily Sales (units)', fontsize=12)
plt.legend(loc='upper left')
plt.grid(True, alpha=0.3)
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.workbench.plots.waitForCurrentPlot();
		logger.log('	✓ Time series plot displayed');

		// Step 3: Box plot for distribution analysis
		logger.log('[Step 3/8] Analyze sales distribution with box plot');
		await app.workbench.console.executeCode(
			'Python',
			`plt.figure(figsize=(10, 6))
df.boxplot(column='Sales', by='Product', figsize=(10, 6))
plt.title('Sales Distribution by Product Category', fontsize=16, fontweight='bold')
plt.suptitle('')	# Remove default title
plt.xlabel('Product Category', fontsize=12)
plt.ylabel('Daily Sales (units)', fontsize=12)
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('	✓ Distribution analysis complete');

		// Step 4: Revenue comparison bar chart
		logger.log('[Step 4/8] Compare total revenue by product');
		await app.workbench.console.executeCode(
			'Python',
			'total_revenue = df.groupby("Product")["Revenue"].sum().sort_values(ascending=False)\n' +
			'\n' +
			'plt.figure(figsize=(10, 6))\n' +
			'colors = plt.cm.viridis(np.linspace(0, 1, len(total_revenue)))\n' +
			'bars = plt.bar(total_revenue.index, total_revenue.values, color=colors, edgecolor="black", linewidth=1.5)\n' +
			'\n' +
			'# Add value labels on bars\n' +
			'for bar in bars:\n' +
			'		 height = bar.get_height()\n' +
			'		 plt.text(bar.get_x() + bar.get_width()/2., height,\n' +
			'							f"${height:,.0f}",\n' +
			'							ha="center", va="bottom", fontsize=10, fontweight="bold")\n' +
			'\n' +
			'plt.title("Q4 Total Revenue by Product Category", fontsize=16, fontweight="bold")\n' +
			'plt.xlabel("Product Category", fontsize=12)\n' +
			'plt.ylabel("Revenue ($)", fontsize=12)\n' +
			'plt.xticks(rotation=45)\n' +
			'plt.grid(True, axis="y", alpha=0.3)\n' +
			'plt.tight_layout()\n' +
			'plt.show()',
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('	✓ Revenue comparison displayed');

		// Step 5: Correlation heatmap
		logger.log('[Step 5/8] Create correlation heatmap');
		await app.workbench.console.executeCode(
			'Python',
			`# Pivot data for correlation analysis
pivot_sales = df.pivot_table(values='Sales', index='Date', columns='Product', aggfunc='sum')
correlation = pivot_sales.corr()

plt.figure(figsize=(8, 6))
plt.imshow(correlation, cmap='coolwarm', aspect='auto', vmin=-1, vmax=1)
plt.colorbar(label='Correlation Coefficient')

# Add correlation values
for i in range(len(correlation)):
		for j in range(len(correlation)):
				plt.text(j, i, f'{correlation.iloc[i, j]:.2f}',
								ha='center', va='center',
								color='white' if abs(correlation.iloc[i, j]) > 0.5 else 'black')

plt.xticks(range(len(products)), products, rotation=45)
plt.yticks(range(len(products)), products)
plt.title('Product Sales Correlation Matrix', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('	✓ Correlation analysis complete');

		// Step 6: Pie chart for market share
		logger.log('[Step 6/8] Visualize market share');
		await app.workbench.console.executeCode(
			'Python',
			`total_sales_by_product = df.groupby('Product')['Sales'].sum()

plt.figure(figsize=(10, 8))
colors = plt.cm.Set3(range(len(products)))
explode = [0.1 if i == 0 else 0 for i in range(len(products))]	# Explode largest slice

wedges, texts, autotexts = plt.pie(
		total_sales_by_product.values,
		labels=total_sales_by_product.index,
		autopct='%1.1f%%',
		colors=colors,
		explode=explode,
		shadow=True,
		startangle=90
)

# Enhance text
for text in texts:
		text.set_fontsize(12)
		text.set_fontweight('bold')
for autotext in autotexts:
		autotext.set_color('white')
		autotext.set_fontsize(11)
		autotext.set_fontweight('bold')

plt.title('Q4 Market Share by Product Category', fontsize=16, fontweight='bold', pad=20)
plt.axis('equal')
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('	✓ Market share visualization complete');

		// Step 7: Histogram of daily sales
		logger.log('[Step 7/8] Analyze daily sales distribution');
		await app.workbench.console.executeCode(
			'Python',
			`plt.figure(figsize=(12, 6))

for i, product in enumerate(products, 1):
		plt.subplot(2, 3, i)
		product_sales = df[df['Product'] == product]['Sales']
		plt.hist(product_sales, bins=20, color=colors[i-1], alpha=0.7, edgecolor='black')
		plt.axvline(product_sales.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {product_sales.mean():.1f}')
		plt.title(product, fontsize=11, fontweight='bold')
		plt.xlabel('Daily Sales')
		plt.ylabel('Frequency')
		plt.legend(fontsize=8)
		plt.grid(True, alpha=0.3)

plt.suptitle('Daily Sales Distribution by Product', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.code.wait(2000);
		logger.log('	✓ Distribution histograms displayed');

		// Step 8: Summary statistics
		logger.log('[Step 8/8] Generate summary insights');
		await app.workbench.console.executeCode(
			'Python',
			'print("=" * 60)\n' +
			'print("Q4 SALES ANALYSIS SUMMARY")\n' +
			'print("=" * 60)\n' +
			'print(f"\\nTotal Records: {len(df):,}")\n' +
			'print(f"Date Range: {df[\'Date\'].min().date()} to {df[\'Date\'].max().date()}")\n' +
			'print(f"Total Revenue: ${df[\'Revenue\'].sum():,.2f}")\n' +
			'print(f"Average Daily Sales: {df[\'Sales\'].mean():.1f} units")\n' +
			'print(f"\\nTop Product by Sales: {total_sales_by_product.idxmax()}")\n' +
			'print(f"Top Product by Revenue: {df.groupby(\'Product\')[\'Revenue\'].sum().idxmax()}")\n' +
			'print(f"\\nBest Sales Day: {df.groupby(\'Date\')[\'Sales\'].sum().idxmax().date()}")\n' +
			'print(f"Peak Sales: {df.groupby(\'Date\')[\'Sales\'].sum().max():.0f} units")\n' +
			'print("=" * 60)',
			'>>>'
		);
		logger.log('	✓ Analysis complete');

		logger.log('🎉 Data Science Workflow Complete!');
		logger.log('📈 Generated 6 visualizations:');
		logger.log('	 1. Time Series - Sales trends over Q4');
		logger.log('	 2. Box Plot - Sales distribution by category');
		logger.log('	 3. Bar Chart - Total revenue comparison');
		logger.log('	 4. Heatmap - Product correlation analysis');
		logger.log('	 5. Pie Chart - Market share breakdown');
		logger.log('	 6. Histograms - Daily sales distributions');
	});

	test('Scientific Data Exploration', async function ({ app, logger, python }) {
		logger.log('🔬 Data Scientist: Exploring Experimental Results');

		// Generate scientific data
		logger.log('[Step 1/4] Generate experimental data');
		await app.workbench.console.executeCode(
			'Python',
			`import numpy as np
import matplotlib.pyplot as plt

# Simulate experimental measurements
np.random.seed(123)
x = np.linspace(0, 10, 100)
y_theoretical = 2 * np.exp(-0.5 * x) * np.sin(2 * x)
y_measured = y_theoretical + np.random.normal(0, 0.2, len(x))

# Calculate residuals
residuals = y_measured - y_theoretical`,
			'>>>'
		);
		logger.log('	✓ Experimental data generated');

		// Create multi-panel scientific plot
		logger.log('[Step 2/4] Create scientific analysis plot');
		await app.workbench.console.executeCode(
			'Python',
			`fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Plot 1: Raw data with theory
ax1 = axes[0, 0]
ax1.scatter(x, y_measured, alpha=0.5, label='Measured', s=30)
ax1.plot(x, y_theoretical, 'r-', linewidth=2, label='Theoretical')
ax1.set_title('Experimental Measurements vs Theory', fontweight='bold')
ax1.set_xlabel('Time (s)')
ax1.set_ylabel('Amplitude')
ax1.legend()
ax1.grid(True, alpha=0.3)

# Plot 2: Residuals
ax2 = axes[0, 1]
ax2.scatter(x, residuals, alpha=0.6, color='purple', s=30)
ax2.axhline(y=0, color='r', linestyle='--', linewidth=2)
ax2.fill_between(x, -0.4, 0.4, alpha=0.2, color='green', label='±2σ band')
ax2.set_title('Residual Analysis', fontweight='bold')
ax2.set_xlabel('Time (s)')
ax2.set_ylabel('Residuals')
ax2.legend()
ax2.grid(True, alpha=0.3)

# Plot 3: Histogram of residuals
ax3 = axes[1, 0]
ax3.hist(residuals, bins=20, color='steelblue', alpha=0.7, edgecolor='black')
ax3.axvline(residuals.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {residuals.mean():.3f}')
ax3.set_title('Residual Distribution', fontweight='bold')
ax3.set_xlabel('Residual Value')
ax3.set_ylabel('Frequency')
ax3.legend()
ax3.grid(True, alpha=0.3)

# Plot 4: Q-Q plot (approximation)
ax4 = axes[1, 1]
sorted_residuals = np.sort(residuals)
theoretical_quantiles = np.random.normal(0, residuals.std(), len(residuals))
theoretical_quantiles.sort()
ax4.scatter(theoretical_quantiles, sorted_residuals, alpha=0.6, color='orange')
ax4.plot([-1, 1], [-1, 1], 'r--', linewidth=2, label='Perfect Normal')
ax4.set_title('Q-Q Plot (Normality Check)', fontweight='bold')
ax4.set_xlabel('Theoretical Quantiles')
ax4.set_ylabel('Sample Quantiles')
ax4.legend()
ax4.grid(True, alpha=0.3)

plt.suptitle('Scientific Data Analysis Dashboard', fontsize=16, fontweight='bold', y=0.995)
plt.tight_layout()
plt.show()`,
			'>>>'
		);
		await app.workbench.plots.waitForCurrentPlot();
		logger.log('	✓ Scientific analysis dashboard created');

		// Statistical summary
		logger.log('[Step 3/4] Calculate statistics');
		await app.workbench.console.executeCode(
			'Python',
			`print("\\n" + "="*50)
print("EXPERIMENTAL ANALYSIS SUMMARY")
print("="*50)
print(f"Number of measurements: {len(x)}")
print(f"Mean residual: {residuals.mean():.4f}")
print(f"Std. deviation: {residuals.std():.4f}")
print(f"Max absolute error: {np.abs(residuals).max():.4f}")
print(f"R² value: {1 - (np.sum(residuals**2) / np.sum((y_measured - y_measured.mean())**2)):.4f}")
print("="*50)`,
			'>>>'
		);
		logger.log('	✓ Statistical analysis complete');

		logger.log('[Step 4/4] Clear plots for next analysis');
		await app.workbench.plots.clearPlots();
		logger.log('	✓ Plots cleared');

		logger.log('🎉 Scientific exploration complete!');
	});

});
