import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifyGrounding() {
    console.log('--- Grounding Verification Test ---');
    console.log('Current Date:', new Date().toLocaleDateString());

    const fredKey = process.env.FRED_API_KEY || process.env.NEXT_PUBLIC_FRED_API_KEY;
    console.log('FRED Key present:', !!fredKey);

    if (fredKey) {
        console.log('Fetching FRED indicators...');
        try {
            // Test FEDFUNDS specifically
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`;
            const response = await axios.get(url);
            const val = response.data.observations[0].value;
            const date = response.data.observations[0].date;
            console.log(`✅ FRED FEDFUNDS SUCCESS: ${val}% as of ${date}`);
        } catch (e) {
            console.error('❌ FRED FETCH FAILED:', e.message);
        }
    }

    console.log('\n--- Simulation of Layered Prompt ---');
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    console.log('Layer 1 (Identity): "You are NewsLens AI... Never mention cutoff..."');
    console.log(`Layer 2 (Date): "Current system date: ${today}"`);
    console.log('Layer 3 (Macro): "FEDFUNDS: 5.33% ..."');
    console.log('Layer 4 (News): "AAPL: $180 ..."');

    console.log('\nVerification Complete.');
}

verifyGrounding();
