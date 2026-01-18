
import * as XLSX from 'xlsx';

/**
 * Helper to parse various date formats into a standard JS Date object
 * @param {string|number} value 
 * @returns {Date|null}
 */
const parseDate = (value) => {
    if (!value) return null;

    // Excel serial number
    if (typeof value === 'number') {
        // Excel base date is Dec 30 1899
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }

    // String DD/MM/YYYY
    if (typeof value === 'string') {
        const parts = value.split('/');
        if (parts.length === 3) {
            // Assume DD/MM/YYYY
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
    }

    // Fallback native parse
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Parses raw Excel file object into JSON
 * @param {File} file 
 * @returns {Promise<Array>}
 */
export const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                // Normalize keys and values
                const normalizedData = jsonData.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        const cleanKey = key.trim().toLowerCase();
                        if (cleanKey.includes('date')) {
                            const parsedDate = parseDate(row[key]);
                            // Use ISO string YYYY-MM-DD for consistency
                            newRow.date = parsedDate ? parsedDate.toISOString().split('T')[0] : row[key];
                            newRow.rawDate = parsedDate;
                        }
                        else if (cleanKey.includes('state')) newRow.state = row[key];
                        else if (cleanKey.includes('min')) newRow.minPrice = Number(row[key]) || 0;
                        else if (cleanKey.includes('max')) newRow.maxPrice = Number(row[key]) || 0;
                        else if (cleanKey.includes('avg')) newRow.avgPrice = Number(row[key]) || 0;
                        else if (cleanKey.includes('commodity')) newRow.commodity = row[key];
                        else newRow[cleanKey] = row[key];
                    });
                    return newRow;
                }).filter(item => item.date); // Remove rows without valid dates

                // Sort by date ascending for charts
                normalizedData.sort((a, b) => new Date(a.date) - new Date(b.date));

                resolve(normalizedData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

// Helper: Calculate Month-over-Month changes for prediction
const predictFutureTrend = (data, targetDate) => {
    if (!data || data.length === 0 || !targetDate) return null;

    const currentMonth = targetDate.getMonth();
    const currentYear = targetDate.getFullYear();

    // Determine Next Month
    let nextMonth = currentMonth + 1;
    let nextYearOffset = 0;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYearOffset = 1;
    }

    const changes = [];
    const priceMap = new Map();

    // Map "Year-Month" to AvgPrice for O(1) lookup
    data.forEach(d => {
        if (!d.rawDate) return;
        const k = `${d.rawDate.getFullYear()}-${d.rawDate.getMonth()}`;
        priceMap.set(k, d.avgPrice);
    });

    // Look at previous years
    // We want specifically the transition from "Month X" to "Month X+1" in historical years
    const uniqueYears = [...new Set(data.map(d => d.rawDate?.getFullYear()))].filter(y => y);

    uniqueYears.forEach(year => {
        // Skip the current future transition if it doesn't exist yet (obviously)
        if (year === currentYear && nextYearOffset === 0) return;

        const currKey = `${year}-${currentMonth}`;
        const nextKey = `${year + nextYearOffset}-${nextMonth}`;

        if (priceMap.has(currKey) && priceMap.has(nextKey)) {
            const currPrice = priceMap.get(currKey);
            const nextPrice = priceMap.get(nextKey);
            const pctChange = ((nextPrice - currPrice) / currPrice) * 100;
            changes.push(pctChange);
        }
    });

    if (changes.length < 1) return null;

    const upCount = changes.filter(c => c > 0).length;
    const downCount = changes.filter(c => c < 0).length; // explicitly count downs
    const total = changes.length;
    const winRate = (upCount / total) * 100;
    const avgChange = changes.reduce((a, b) => a + b, 0) / total;

    const nextMonthName = new Date(2000, nextMonth, 1).toLocaleString('default', { month: 'long' });

    return {
        direction: winRate >= 50 ? 'UP' : 'DOWN',
        probability: winRate >= 50 ? winRate : (100 - winRate), // If 20% win rate (up), then 80% probability of Down
        avgChange: avgChange,
        sampleSize: total,
        nextMonthName: nextMonthName
    };
};

/**
 * Analyzes price trends and generates recommendations
 * Context-Aware Version: Uses Seasonality Data if available
 * @param {Array} data - Array of price objects
 * @param {Object} seasonalityData - Result from analyzeSeasonality
 * @param {Object} [targetEntry] - Specific data point to analyze (optional, defaults to latest)
 * @returns {Object} Recommendation with reason
 */
export const analyzeMarket = (data, seasonalityData, targetEntry = null) => {
    if (!data || data.length === 0) return { action: 'Unknown', confidence: 'Low', reason: 'No data available' };

    const currentEntry = targetEntry || data[data.length - 1];
    const currentPrice = currentEntry.minPrice;

    // 1. Basic Technical Check (Global Min)
    const sortedByPrice = [...data].sort((a, b) => a.minPrice - b.minPrice);
    const globalMin = sortedByPrice[0].minPrice;
    const globalMax = sortedByPrice[sortedByPrice.length - 1].maxPrice;

    // 2. Seasonal Context Check
    let seasonalAnalysis = null;
    if (seasonalityData && currentEntry.rawDate) {
        const currentMonthIndex = currentEntry.rawDate.getMonth(); // 0-11
        const monthStats = seasonalityData.monthlyAverages[currentMonthIndex];

        if (monthStats && monthStats.count > 0) {
            const seasonalAvg = monthStats.avgPrice;
            const deviation = ((currentPrice - seasonalAvg) / seasonalAvg) * 100;
            const isTypicalLowMonth = seasonalityData.bestMonth.month === monthStats.month;

            seasonalAnalysis = {
                month: monthStats.month,
                avg: seasonalAvg,
                deviation: deviation, // % diff from historical avg for this month
                isBestMonth: isTypicalLowMonth
            };
        }
    }

    // 3. Year-over-Year (YoY) Check
    let yoyAnalysis = null;
    if (currentEntry.rawDate) {
        const currentParams = {
            month: currentEntry.rawDate.getMonth(),
            year: currentEntry.rawDate.getFullYear()
        };
        const prevYear = currentParams.year - 1;

        // Find data points for the same month in the previous year
        const prevYearData = data.filter(d => {
            if (!d.rawDate) return false;
            return d.rawDate.getMonth() === currentParams.month && d.rawDate.getFullYear() === prevYear;
        });

        if (prevYearData.length > 0) {
            // Calculate avg price for that month last year
            const prevYearAvg = prevYearData.reduce((acc, curr) => acc + curr.avgPrice, 0) / prevYearData.length;
            const change = ((currentPrice - prevYearAvg) / prevYearAvg) * 100;

            yoyAnalysis = {
                prevYear: prevYear,
                prevPrice: prevYearAvg,
                change: change
            };
        }
    }

    // Recommendation Logic Tree
    const totalAvg = data.reduce((acc, curr) => acc + curr.avgPrice, 0);
    const marketAverage = totalAvg / data.length;

    let result = {
        action: 'Wait',
        confidence: 'Low',
        reason: 'Analyzing market trends...',
        type: 'neutral',
        seasonalAnalysis,
        yoy: yoyAnalysis
    };

    // Case A: Near All-Time Low (Strongest Signal)
    if (currentPrice <= globalMin * 1.05) {
        result.action = 'Buy Now';
        result.confidence = 'Very High';
        result.reason = `Price is at an all-time low (₹${currentPrice}). This is a rare buying opportunity.`;
        result.type = 'positive';
    }
    // Case B: Seasonal Analysis Available
    else if (seasonalAnalysis) {
        const { deviation, month, isBestMonth } = seasonalAnalysis;

        // Price is significantly below historical average for this month
        if (deviation < -10) {
            result.action = 'Buy';
            result.confidence = 'High';
            result.reason = `Price is ${Math.abs(deviation.toFixed(1))}% lower than the typical average for ${month}.`;
            result.type = 'positive';
        }
        // Price is typical, but it is the "Best Month" of value usually
        else if (isBestMonth && Math.abs(deviation) < 10) {
            result.action = 'Buy';
            result.confidence = 'Medium';
            result.reason = `${month} is historically the best time to buy. Price matches typical low trends.`;
            result.type = 'positive';
        }
        // Price is inflated for this time of year
        else if (deviation > 15) {
            result.action = 'Wait';
            result.confidence = 'High';
            result.reason = `Price is ${deviation.toFixed(1)}% higher than usual for ${month}. Expect correction.`;
            result.type = 'negative';
        }
    }
    // Case C: Fallback to Simple Average
    else if (currentPrice < marketAverage) {
        result.action = 'Accumulate';
        result.confidence = 'Medium';
        result.reason = `Price is below the long-term market average (${marketAverage.toFixed(0)}), but not a steep bargain.`;
        result.type = 'neutral';
    } else {
        result.action = 'Wait';
        result.confidence = 'Medium';
        result.reason = `Price (${currentPrice}) is above average (${marketAverage.toFixed(0)}).`;
        result.type = 'negative';
    }

    // 5. Predictive Analysis (Look Ahead)
    result.prediction = predictFutureTrend(data, currentEntry.rawDate);

    return result;
};

/**
 * Get unique list of states
 * @param {Array} data 
 */
export const getUniqueStates = (data) => {
    const states = new Set(data.map(item => item.state).filter(Boolean));
    return Array.from(states).sort();
};

/**
 * Filter data by time range
 */
export const filterByTimeRange = (data, range) => {
    if (range === 'All') return data;
    if (!data.length) return data;

    // Sort just in case
    const sortedDates = data.map(d => new Date(d.date)).sort((a, b) => a - b);
    const lastDate = sortedDates[sortedDates.length - 1];

    const cutoff = new Date(lastDate);

    switch (range) {
        case '7D': cutoff.setDate(cutoff.getDate() - 7); break;
        case '1M': cutoff.setMonth(cutoff.getMonth() - 1); break;
        case '3M': cutoff.setMonth(cutoff.getMonth() - 3); break;
        case '6M': cutoff.setMonth(cutoff.getMonth() - 6); break;
        case '1Y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
        default: return data;
    }

    return data.filter(item => new Date(item.date) >= cutoff);
}

/**
 * Aggregates data by month to find seasonal trends
 * Enhanced to track min/max ranges per month
 * @param {Array} data 
 * @returns {Object} 
 */
export const analyzeSeasonality = (data) => {
    if (!data || data.length === 0) return null;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Initialize buckets
    const monthStats = {};

    data.forEach(item => {
        const date = new Date(item.date);
        const monthIndex = date.getMonth();

        if (!monthStats[monthIndex]) {
            monthStats[monthIndex] = { total: 0, count: 0, min: Infinity, max: -Infinity };
        }

        const avg = item.avgPrice;

        monthStats[monthIndex].total += avg;
        monthStats[monthIndex].count += 1;
        monthStats[monthIndex].min = Math.min(monthStats[monthIndex].min, item.minPrice);
        monthStats[monthIndex].max = Math.max(monthStats[monthIndex].max, item.maxPrice);
    });

    const monthlyAverages = monthNames.map((name, index) => {
        const stat = monthStats[index];
        if (!stat || stat.count === 0) {
            return { month: name, avgPrice: 0, count: 0, min: 0, max: 0 };
        }
        return {
            month: name,
            avgPrice: stat.total / stat.count,
            min: stat.min,
            max: stat.max,
            count: stat.count
        };
    });

    const validMonths = monthlyAverages.filter(m => m.count > 0);

    if (validMonths.length === 0) return null;

    const sortedByPrice = [...validMonths].sort((a, b) => a.avgPrice - b.avgPrice);
    const bestMonth = sortedByPrice[0];
    const worstMonth = sortedByPrice[validMonths.length - 1];

    return { monthlyAverages, bestMonth, worstMonth };
};
