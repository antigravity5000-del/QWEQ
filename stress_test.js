const http = require('http');

// First, test a GET to /api/menu to confirm server is up and responding
function get(path, port = 3000) {
    return new Promise((resolve, reject) => {
        const req = http.get({ hostname: '127.0.0.1', port, path }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', e => reject(e));
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function post(path, data, port = 3000) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const opts = {
            hostname: '127.0.0.1', port,
            path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        };
        const req = http.request(opts, (res) => {
            let b = '';
            res.on('data', d => b += d);
            res.on('end', () => resolve({ status: res.statusCode, body: b }));
        });
        req.on('error', e => reject(e));
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.write(body);
        req.end();
    });
}

async function runStressTest() {
    console.log('🔍 Step 1: Pinging /api/menu to confirm server is alive...');
    try {
        const ping = await get('/api/menu');
        if (ping.status === 200) {
            console.log(`✅ Server is UP on port 3000. Menu items: ${JSON.parse(ping.body).length}`);
        } else {
            console.log(`⚠️ Server responded with status ${ping.status}. Body: ${ping.body.substring(0, 100)}`);
            return;
        }
    } catch (e) {
        console.log(`❌ Server unreachable: ${e.message}`);
        return;
    }

    console.log('\n🚀 Step 2: Stress test - 50 simultaneous POST /api/orders...\n');

    const makeOrder = (i) => ({
        id: `STRESS-${i}-${Date.now()}`,
        customer: { name: `Tester ${i}`, phone: '123', address: 'Veritas University, Abuja', notes: 'Auto test' },
        items: [{ id: 'mains-1', name: 'Jollof Rice', price: 400, quantity: 1 }],
        fees: { takeaway: 0, delivery: 0 },
        total: 400,
        status: 'pending',
        date: new Date().toISOString()
    });

    const TOTAL = 50;
    const BATCH_SIZE = 10;
    const results = [];

    const start = Date.now();

    for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL; j++) {
            batch.push(post('/api/orders', makeOrder(i + j)));
        }
        process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/5... `);
        const settled = await Promise.allSettled(batch);
        const ok = settled.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
        const fail = settled.length - ok;
        console.log(`✅ ${ok} ok, ❌ ${fail} failed`);
        results.push(...settled);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
    const failures = results.length - successes;

    console.log('\n══════════════════════════════════════');
    console.log('         📊 STRESS TEST RESULTS        ');
    console.log('══════════════════════════════════════');
    console.log(`  Total Requests  : ${TOTAL}`);
    console.log(`  ✅ Successes    : ${successes}`);
    console.log(`  ❌ Failures     : ${failures}`);
    console.log(`  ⏱️  Time Elapsed : ${elapsed}s`);
    console.log(`  🚀 Avg Speed    : ${(TOTAL / elapsed).toFixed(1)} req/s`);
    console.log('══════════════════════════════════════');

    if (failures === 0) {
        console.log('\n💎 PERFECT SCORE — Zero crashes under simulated load!\n');
    } else {
        const sample = results.find(r => r.status === 'rejected' || r.value?.status !== 200);
        console.log('\n⚠️ Some failures detected. Sample:', sample?.reason || sample?.value?.body?.substring(0, 80));
    }
}

runStressTest();
