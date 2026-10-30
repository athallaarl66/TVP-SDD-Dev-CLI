# Change request: audit sdd-gen, template, breakdown Epic/User Story, dan memory lokal

Status: hasil eksplorasi dan permintaan perubahan; belum diimplementasikan. Dokumen ini bukan hasil QA formal atau bukti fitur sudah tersedia. Scope: CLI `D:/tal/TVP-SDD-Dev-CLI` versi lokal 1.5.0. Tidak terkait pertanyaan login produksi di percakapan; aplikasi/lingkungan login tersebut belum diidentifikasi.

## 1. Struktur hasil `/breakdown-task`

PRD perlu menandai Epic dan User Story secara eksplisit. Nama keduanya dinormalisasi menjadi slug yang aman untuk nama folder. Hasil breakdown ditata seperti berikut:

```text
docs/production/<feature>/
  <epic-slug>/
    <story-no>-<story-slug>/
      prod.md
      tech.md
      design.md
      testing.md
```

Nomor story menjaga urutan dan membedakan judul yang sama. Story yang tidak punya Epic harus mendapat penanganan eksplisit (pesan kesalahan atau kelompok default yang disepakati), bukan diam-diam ditempatkan pada Epic yang salah. Format heading Epic, aturan story tanpa Epic, dan cara membaca file layout lama perlu ditetapkan sebelum implementasi.

Saat ini `templates/prd-template.md` belum punya heading Epic, `lib/commands/breakdown.js` menulis empat file secara datar ke `docs/production/<feature>/`, sedangkan `lib/commands/implement-code.js` dan `lib/commands/qa-test-script.js` membacanya dari folder datar tersebut. Perubahan template saja tidak cukup; ketiga alur harus disesuaikan bersama. Jangan menghapus atau menimpa breakdown lama tanpa persetujuan/`--force`.

## 2. Konsistensi template dan isi dokumen

- Perbaiki pembacaan acceptance criteria: PRD memakai `**Acceptance Criteria:**`, tetapi parser di `lib/utils/file.js` tidak mengenalinya. Kriteria nyata saat ini bisa berubah menjadi `TBD` pada hasil breakdown. Cakup kriteria `[ ]` dan `[x]`, serta hentikan pengambilan kriteria saat section berikutnya dimulai.
- Pisahkan template spec-test tingkat fitur untuk `/init` dari `testing-template.md` tingkat User Story. `/init` saat ini menyalin placeholder `<StoryId>` dan `<AcceptanceCriteria>` tanpa data story.
- Jelaskan bahwa `/qa-report` menghasilkan draft manual, bukan laporan eksekusi yang telah diverifikasi. `qa-report-template.md` berjudul Playwright E2E meski CLI mendukung framework lain dan masih menyimpan token seperti `{FEATURE_NAME}`.
- Tinjau placeholder lain di sembilan template (`templates/`) berdasarkan generator masing-masing. Isi hanya nilai yang benar-benar tersedia; jangan mengarang hasil tes, angka, atau evidence.

## 3. Memory lokal saja

Memory sdd-gen disimpan per proyek di `.sdd/memory/`, tanpa cloud, akun, sinkronisasi antar-device, database, atau LLM di CLI. Folder memory diabaikan Git; `.sdd/manifest.json` tetap dapat dilacak. Tidak ada klaim isolasi per-user bila beberapa orang menggunakan folder proyek yang sama. Pindah device memerlukan penyalinan manual sampai mekanisme export/import disepakati.

Ini meneruskan keputusan pada `openspec/changes/project-memory-and-gate/`; jangan membuat rancangan memory tandingan. Saat dicatat, `lib/memory.js` belum ada dan `.gitignore` belum mengabaikan `.sdd/memory/`: memory masih rencana, bukan fitur berjalan. Pekerjaan memory bergantung pada perubahan freshness, coverage, dan MCP yang telah direncanakan.

## Kriteria penerimaan untuk pekerjaan berikutnya

1. PRD dengan lebih dari satu Epic dan beberapa User Story menghasilkan folder Epic/Story yang sesuai; nama folder aman dan tidak bertabrakan.
2. Setiap story menghasilkan empat dokumen dalam foldernya, berisi acceptance criteria yang benar, bukan `TBD` bila kriteria ada di PRD.
3. `/implement-code` dan `/qa-test-script` menemukan dokumen nested; penanganan layout lama dan story tanpa Epic ditetapkan dan diuji.
4. `/init` tidak mengeluarkan placeholder tingkat story tanpa data story; QA report tidak diklaim sebagai hasil pengujian otomatis.
5. Bila memory diterapkan: tersimpan lokal per proyek, tidak ikut Git, tidak tersinkron ke cloud; perilaku ini diverifikasi dari implementasi dan tes.
6. `/qa-test-run` menolak menimpa `qa-run:<feature>` yang berbeda tanpa `--force`, diuji terhadap `package.json` yang telah diedit pengguna.
7. Batas tulis filesystem diuji pada symlink/junction terisolasi; bila terbukti lolos keluar root, penulisan ditolak dan uji regresi lintas OS ditambahkan.
8. QA report baru menyatakan status draft/belum dieksekusi; placeholder hasil dan bukti tidak terlihat sebagai tes yang sudah lulus.

## 4. Temuan audit dari sesi explore (yang terlewat dari catatan awal)

### Bug, keamanan, dan kesiapan

| Prioritas | Status | Bukti kode | Perubahan yang diminta | Risiko perubahan |
| --- | --- | --- | --- | --- |
| Tinggi | Bug terkonfirmasi lewat probe parser | `templates/prd-template.md:59,71` memakai `**Acceptance Criteria:**`; `lib/utils/file.js:183-189` mencari `**Acceptance Criteria**` sebelum tanda `:`. Dua story dari template asli terbaca, masing-masing nol kriteria. `lib/commands/breakdown.js:131-136,211-216` mengganti yang kosong menjadi `TBD`. | Cocokkan heading dari template, tangani checkbox `[ ]` dan `[x]`, hentikan pembacaan pada heading/section berikutnya. Test harus memeriksa isi output, bukan hanya nama file. | Sedang: parser PRD lama dengan variasi heading perlu diuji agar tidak salah mengelompokkan checklist. |
| Tinggi | Overwrite terkonfirmasi dari kode, belum uji end-to-end | `lib/commands/qa-test-run.js:193-197` mengisi ulang `packageJson.scripts[qa-run:<feature>]` tanpa pemeriksaan existing/`--force`. | Jika script sudah ada dan berbeda, jangan overwrite tanpa `--force`; jaga perubahan `package.json` sekecil mungkin. | Sedang: perilaku pemanggilan berulang berubah; jangan merusak script milik user. |
| Sedang | Risiko bersyarat, belum dibuktikan sebagai exploit | `lib/utils/file.js:48-68` memakai `path.resolve`/`path.relative`, bukan `realpath` dari parent/target yang sudah ada. Symlink dalam folder keluaran dapat menunjuk keluar root meskipun path leksikal di dalam. | Buktikan lewat fixture symlink terisolasi, lalu terapkan pemeriksaan target nyata bila terbukti; tetap lindungi penulisan dan `--force`. | Sedang: penanganan link/junction beda OS, perlu test Windows dan Linux. |
| Informasi keamanan | Tidak ada bukti RCE langsung via nama fitur pada audit ini; **bukan** jaminan bebas RCE | `lib/utils/file.js:24-45` membatasi slug. `lib/commands/qa-test-run.js:93-111` menjalankan argumen terpisah, kecuali shim Maven Windows lewat `cmd.exe`. `lib/utils/file.js:201-227` dapat menginstal Playwright. | Pertahankan validasi slug; uji jalur Maven Windows dan tidak jalankan `/qa-test-run` pada repo/dependency yang tidak tepercaya. Eksekusi test dari proyek pengguna adalah perilaku sengaja, berbeda dari command injection CLI. | Tinggi bila audit menyebut 'aman dari semua RCE' tanpa uji lebih luas. |

Audit sebelumnya hanya memeriksa sintaks 35 file JavaScript (`node --check`, lolos) dan probe parser; belum menjalankan full test suite, uji symlink, dependency security scan, atau pen-test. Jangan mengubah status temuan bersyarat menjadi vulnerability terkonfirmasi tanpa reproduksi.

### Audit seluruh sembilan template dan hubungan ke generator

| Template | Pemakai | Temuan / arah perubahan |
| --- | --- | --- |
| `prd-template.md` | `/prd`, `/init` | Banyak section PRD berguna, tetapi User Story langsung di bawah `### 4.1 User Stories`; tidak ada Epic atau ID AC stabil. Tambah penanda Epic yang bisa diparse dan selaraskan sintaks kriteria dengan parser. Hindari memindahkan story dari Epic sebelumnya diam-diam. |
| `technical-template.md` | `/technical`, `/init` | Technical design tingkat fitur memuat arsitektur, DB, API, frontend, keamanan, testing. Pertahankan sifat draft; contoh endpoint/tabel adalah placeholder, bukan implementasi. Selaraskan referensi Epic/story bila struktur PRD berubah. |
| `prod-template.md` | `/breakdown-task` | Dokumen tingkat story dan `<AcceptanceCriteria>` sudah tersedia, tetapi sumbernya hilang akibat bug parser. Tambah identitas Epic/story/ID kriteria tanpa menduplikasi seluruh PRD. |
| `tech-template.md` | `/breakdown-task` | Spesifikasi story berisi contoh endpoint CRUD dan izin. Tandai contoh sebagai opsional, bukan perintah menciptakan CRUD yang tidak diperlukan. Rujuk Epic/story yang benar. |
| `design-template.md` | `/breakdown-task` | Struktur desain UI tingkat story; bagian yang tidak relevan untuk pekerjaan non-UI sebaiknya jelas opsional agar tidak memaksa isi fiktif. |
| `testing-template.md` | `/breakdown-task` **dan** `/init` | Tepat untuk skenario story, tetapi `/init` menggunakannya sebagai spec-test tingkat fitur; token `<StoryId>`, `<StoryTitle>`, dan `<AcceptanceCriteria>` tetap mentah karena `fillDocTemplate` tidak mengisinya (`lib/commands/init.js:24-27,52-55`). Pisahkan template tingkat fitur dari template tingkat story. |
| `qa-report-template.md` | `/qa-report`, `/init` | Judul `Playwright E2E Test Report` dan tabel hasil, screenshot, pass rate masih berupa contoh; generator menyalin langsung tanpa mengisi `{FEATURE_NAME}`, `{DATE}`, `{PASSED}` (`lib/commands/qa-report.js:34-46`). Jadikan draft lintas-framework dengan status 'belum dieksekusi'; jangan tampilkan hasil palsu. |
| `feature-design-template.md` | `/feature-design` | Kerangka desain fitur; generator mengganti `{FeatureName}` (`lib/commands/feature-design.js:34-37`), placeholder lain untuk diisi manual. Jangan mengaku seluruh kontennya sudah terisi otomatis. |
| `design-system-template.md` | `/design-system` | Kerangka token warna, tipografi, spacing, komponen, aksesibilitas; disalin sebagai draft manual (`lib/commands/design-system.js:24-34`). Tidak wajib untuk proyek tanpa UI. |

Catatan: review ini menilai kesesuaian template dengan kode generator, bukan menilai kualitas isi setelah pengguna mengisinya. Sebagian besar placeholder memang dibiarkan untuk diisi manual. Target bukan mengisi semua placeholder secara otomatis, melainkan menghapus ketidaksesuaian kontrak antar-perintah dan mencegah contoh fiktif terbaca sebagai hasil nyata.

### Peta perubahan dan regresi yang harus dijaga

- Writer: `templates/prd-template.md`, `lib/utils/file.js` (`parseUserStories`), `lib/commands/breakdown.js`; template story `prod-template.md`, `tech-template.md`, `design-template.md`, `testing-template.md` bila perlu identitas Epic/Story.
- Reader: `lib/commands/implement-code.js` (`findScenario`, `listScenarioNumbers`, `buildBrief`) dan `lib/commands/qa-test-script.js` (`readdir` folder datar). Pastikan pencarian nomor story tidak mencampur Epic berbeda. Perbarui output bantuan/path di `README.md` dan pesan CLI saat implementasi, bukan dalam change request ini.
- Generator tingkat fitur: `lib/commands/init.js`, `lib/commands/qa-report.js`, `lib/commands/feature-design.js`, `lib/commands/design-system.js`. Jangan mengubah generator yang sudah sesuai hanya karena templatenya panjang.
- Tes relevan: `tests/cli/breakdown.test.js`, `tests/cli/safety.test.js`, `tests/cli/implement-code.test.js`, `tests/cli/test-generation.test.js`, `tests/cli/non-interactive.test.js`, ditambah tes parser/QA report/memory sesuai perubahan. Pertahankan aturan tidak menimpa tanpa `--force` dan test hasil isi criteria.
- Rencana coverage yang sudah ada di `openspec/changes/acceptance-criteria-coverage/` mengasumsikan nama file `*-testing.md` pada layout datar; saat diimplementasikan, telusuri folder nested dan pastikan ID AC tetap terhubung dari PRD ke hasil breakdown dan test.

### Memory: batasan dan kaitannya dengan rencana yang sudah ada

- Tujuan pengguna: **lokal saja**, per proyek di mesin tempat CLI berjalan. Tidak ada login, layanan remote, cloud, akun, atau sinkronisasi antar-device dalam permintaan ini. Dua user yang berbagi folder proyek yang sama belum punya isolasi memory; jangan mengklaim memory sudah 'per user dan per device'.
- Desain yang sudah dicatat pada `openspec/changes/project-memory-and-gate/`: `.sdd/memory/project.md` untuk konvensi, `.sdd/memory/decisions/<ID>.md` (`ADR-001`/`REQ-001`/`NOTE-001`), `.sdd/memory/features/<feature>/log.md`. Entri baru draft sampai dikonfirmasi; rujukan file dapat membuat entri stale; perubahan keputusan ditandai superseded, bukan dihapus.
- `.sdd/memory/` harus masuk `.gitignore`; `.sdd/manifest.json` tidak di-ignore. Verifikasi dengan `git check-ignore`. Kondisi kode saat audit: `lib/memory.js` tidak ada dan belum ada aturan ignore tersebut. Tidak ada memory sdd-gen aktif.
- Urutan dependensi rencana: `document-freshness-and-context` lalu `acceptance-criteria-coverage`, `mcp-context-server`, kemudian `project-memory-and-gate`. Tidak perlu DB/embeddings/API key. Export/import dan sync bukan scope rilis awal; salin manual bila pindah mesin, setelah format data tersedia.

### Peningkatan fitur yang sempat dibahas (bukan perubahan wajib request ini)

- Roadmap konteks yang sudah ada di `.hermes/plans/2026-10-21_context-engineering-platform-v2.md`: manifest freshness → coverage AC ke test → MCP stdio → memory lokal. Semua merupakan rencana; cek kode sebelum mengklaim terpasang.
- `/coverage` perlu menghindari hasil `0/0` membingungkan pada PRD lama dan menyediakan `--backfill`; coverage berbasis pencocokan teks tidak membuktikan test benar-benar mengeksekusi assertion. Gate awal sebaiknya hanya memblokir dokumen stale, bukan coverage heuristik.
- Onboarding: README/CLI perlu satu jalur pertama yang jelas dan contoh hasil nyata; jangan menambah generator baru hanya untuk menambah jumlah command.

## 5. Keputusan yang sudah final vs belum

Final dari pengguna: susun hasil breakdown menurut **Epic → User Story** agar rapi; memory **lokal saja**; catat di `docs/change-request/`, tidak implementasi sekarang.

Usulan struktur yang masih perlu persetujuan sebelum coding: folder per story dengan empat file `prod.md`, `tech.md`, `design.md`, `testing.md`, seperti contoh bagian 1. Pesan sebelumnya menawarkan alternatif satu `user-story.md` di bawah Epic; jawaban 'yes mau gitu' tidak membedakan secara tegas alternatif tersebut. Jangan menandai empat-file nesting sebagai keputusan final sebelum dikonfirmasi.

Belum diputuskan: sintaks heading Epic di PRD, penanganan story tanpa Epic, nomor story global atau per Epic, layout lama dibaca bersamaan atau dimigrasikan, dan kapan memory lokal diimplementasikan. Rekomendasi awal: pertahankan pembacaan layout lama selama transisi dan tolak konflik identifier secara eksplisit; ini usulan, bukan persetujuan pengguna.

Tidak ada kode, template, maupun artefak OpenSpec yang diubah oleh pencatatan ini.
