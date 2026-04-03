import React, { useState } from 'react';

export default function BlogPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const articles = [
    { 
      title: '2025 Yılı Kira Gelir Vergisi (GMSİ) İstisnaları', 
      date: '5 Mart 2026', 
      snippet: 'Bu yıl kira gelirlerinde uygulanacak mesken istisnası ve detayları hakkında her şey.',
      content: '2025 beyanname dönemi için 2024 yılı konut kira gelirleri istisnası 33.000 TL iken, 2025 takvim yılı (2026\'da verilecek) için bu özel istisna tutarı 47.000 TL olarak belirlenmiştir. Eğer yıl içinde bu tutarın üzerinde konut kira geliri elde ettiyseniz beyanname vermeniz zorunludur. İş yeri (stopajlı) kiralarda ise beyan sınırı çok daha yüksektir. Götürü gider yöntemini seçerseniz %15 vergi matrahından herhangi bir faturaya ihtiyaç duymaksızın silebilirsiniz.'
    },
    { 
      title: 'Birden Fazla İşverenden Ücret Alanlar Dikkat!', 
      date: '20 Şubat 2026', 
      snippet: 'GVK Madde 86 kapsamında beyanname sınırları ve ikinci işveren hesaplamaları.',
      content: 'Eğer bir yıl içinde birden fazla işverenden maaş/ücret aldıysanız (job change) kümülatif vergi matrahınız önemlidir. İkinci veya sonraki işverenlerin vergi matrahları toplamı GVK 86. Maddedeki sınırı aştığında (2025 dönemi için bu sınır 330.000 TL\'dir) tüm maaşlarınızı Hazine ve Maliye Bakanlığı\'na Hazır Beyan Sistemi üzerinden bildirmeli ve çıkan gelir vergisini ödemelisiniz.'
    },
    { 
      title: 'Sık Yapılan Beyanname Hataları', 
      date: '10 Şubat 2026', 
      snippet: 'Hazır Beyan sistemine veri girerken en çok yapılan 5 hata ve çözüm yolları.',
      content: 'Ücret beyanları sırasında en sık yapılan hata: brüt ücret yerine net ücret girilmesi, önceki aylara ait SGK ve işsizlik sigorta primlerinin kümülatif tutara yanlış eklenmesi ve istisna tutarlarının GVK 23/18. madde yerine eski usule göre hesaplanmasıdır. Sistemimiz tüm bunları otomatik sizin yerinize yapmaktadır, elde ettiğiniz "Kesilen Gelir Vergisi" ve "Ödenecek Tutar" değerlerini GİB ile karşılaştırarak güvenle formunuzu gönderebilirsiniz.'
    },
  ];

  return (
    <div className="animate-in pb-4">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Vergi ve Beyan Blogu</h2>
        <p className="text-muted mb-3">KolayBeyan uzmanları tarafından hazırlanan güncel vergi rehberleri.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {articles.map((art, i) => (
            <div key={i} onClick={() => setOpenIndex(openIndex === i ? null : i)} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', transition: 'var(--transition)', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>{art.title}</h3>
              <p className="text-sm text-muted mb-2">{art.date}</p>
              
              {openIndex === i ? (
                <div style={{ fontSize: '0.95rem', lineHeight: '1.6', marginTop: '0.75rem', color: 'var(--text-main)' }}>
                  {art.content}
                  <div style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-blue-light)' }}>↑ Kapat</div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{art.snippet}</p>
                  <div style={{ marginTop: '0.75rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-blue-light)' }}>Devamını Oku →</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
