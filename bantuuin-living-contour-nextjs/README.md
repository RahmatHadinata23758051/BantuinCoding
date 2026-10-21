# Bantuuin — Living Contour Background

Animated/interactive background for a React / Next.js App Router app. No Three.js, shaders, video files or animation packages. One canvas element, local CSS gradients, no network requests.

## Integrasi

1. Salin `LivingContourBackground.tsx` dan `living-contour.css` ke folder `components` (atau sesuaikan path CSS-nya).
2. Letakkan background sebagai anak pertama dari container hero atau page.
3. Gunakan wrapper dengan `position: relative`, `isolation: isolate`, `overflow: hidden`, dan content dengan `position: relative; z-index: 1`.

```tsx
'use client';

import { useState } from 'react';
import LivingContourBackground from '@/components/LivingContourBackground';

export function DashboardHero() {
  const [formFocused, setFormFocused] = useState(false);

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <LivingContourBackground quiet={formFocused} />
      <div className="relative z-10">
        {/* Pertahankan navbar, headline, dan input Bantuuin yang sudah ada. */}
        <section
          onFocusCapture={() => setFormFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setFormFocused(false);
            }
          }}
        >
          {/* Input judul dan textarea project yang sudah ada. */}
        </section>
      </div>
    </main>
  );
}
```

## Behavior

- Garis contour bergerak lambat dan menjauh halus dari pointer.
- Fokus di form: `quiet={true}` meredupkan garis, tanpa memengaruhi interaksi form.
- Ukuran canvas mengikuti ResizeObserver, termasuk resize layout responsif.
- DPR maksimum 2 untuk mengurangi biaya rendering layar retina.
- Animasi berhenti saat background tidak terlihat atau tab tidak aktif.
- Pada mobile maksimum 30 FPS, tanpa interaksi pointer sentuh.
- Menghormati pengaturan OS `prefers-reduced-motion` (gambar statis).
- Tidak menyentuh state, API, submission logic, atau struktur halaman existing.

**Catatan:** `LivingContourBackground` adalah komponen dekoratif. Tidak menambah `button`, dependensi, fitur AI, atau logika backend.
