// Test script to verify the full generation pipeline
async function testGenerate() {
  try {
    console.log('Testing /api/marketing/gerar endpoint...\n');
    
    const payload = {
      prompt: "Post sobre o carnaval chegando e a importância de aproveitar as promoções de imóveis agora",
      formato: "copy",
      tipo: "post"
    };
    
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('\nSending request...\n');
    
    const response = await fetch('http://localhost:3000/api/marketing/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail auth but shows us if server is reachable
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Pipeline is working.');
      if (result.slides) {
        console.log(`\nGenerated ${result.slides.length} slide(s):`);
        result.slides.forEach(s => {
          console.log(`  - Slide ${s.index}: ${s.url}`);
        });
      }
      if (result.legenda) {
        console.log('\nCaption:', result.legenda);
      }
    } else {
      console.log('\n❌ Request failed');
      if (result.hint) {
        console.log('Hint:', result.hint);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGenerate();
