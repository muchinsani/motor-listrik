# Format Komentar Review

Gunakan format berikut menggantikan template komentar bawaan. Isi template berdasarkan temuan aktual; jangan tampilkan placeholder.

## Template Review Summary

```markdown
## Ringkasan
{{Ringkasan perubahan dan hasil review dalam 1–2 kalimat}}

## Temuan
- **{{Severity}} — `{{file:baris}}`:** {{Masalah, dampak, dan saran perbaikan}}

## Pengujian
- {{Skenario pengujian yang direkomendasikan}}
```

## Template Komentar Inline

```markdown
**Severity:** {{Kritis/Tinggi/Sedang/Rendah}}
**Masalah:** {{Defect dengan nama fungsi atau variabel terkait}}
**Dampak:** {{Risiko konkret}}
**Saran:** {{Perbaikan yang dapat dilakukan}}
```

## Aturan

- Gunakan Bahasa Indonesia, tanpa emoji atau pembuka panjang.
- Hanya buat komentar inline untuk defect terverifikasi pada baris yang relevan.
- Gabungkan temuan terkait pada blok kode yang sama; jangan menduplikasi penjelasan lengkap di summary.
- Jika menggunakan PRD, TRD, atau Coding Standard, cantumkan referensi dokumen yang benar-benar dibaca.
- Jika tidak ada defect, isi bagian Temuan dengan "Tidak ada defect terverifikasi pada perubahan yang ditinjau."
- Bedakan rekomendasi pengujian dari hasil aktual; jangan mengklaim pengujian lulus tanpa bukti.
