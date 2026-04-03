import React from 'react';

export default function RehberPage() {
  const faqs = [
    { q: 'Verilerim güvende mi? Nereye kaydediliyor?', a: 'KolayBeyan %100 tarayıcı (browser) tabanlı çalışır. PDF dosyalarınız ve hesaplamalarınız hiçbir şekilde bir sunucuya yüklenmez, sayfayı kapattığınız an tüm veriler bilgisayarınızdan silinir.' },
    { q: 'Hangi vergileri hesaplayabilirim?', a: 'Şu an aktif olarak Ücret Gelir Vergisi (Bordro) ve Gayrimenkul Sermaye İradı (Kira) hesaplamalarını 2025 yılı GVK dilimlerine göre yapabilirsiniz.' },
    { q: 'Götürü Gider yöntemi nedir?', a: 'Kira gelirinizden fatura ve belge gerekmeksizin %15 oranında standart indirim yapılmasını sağlayan pratik bir yöntemdir.' }
  ];

  return (
    <div className="animate-in pb-4">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Rehber ve Sıkça Sorulan Sorular</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent-blue-light)' }}>S:</span> {faq.q}
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>C:</span> {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>Beyanname Vermeli Miyim?</h3>
          <p className="mt-2 text-sm text-muted">
            Tek işverenden 4.300.000 TL, veya birden fazla işverenden ücret alıp birinci işverenden sonraki işverenlerin toplamı 330.000 TL'yi aşan ücretliler beyanname vermek zorundadır. KolayBeyan Ücret modülünü kullanarak durumunuzu saniyeler içinde doğrulayabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
