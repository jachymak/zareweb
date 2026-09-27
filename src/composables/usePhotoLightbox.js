import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'
import { fitWithin, PREVIEW_EDGE } from '@shared/photos'
import { originalUrl } from '@/services/photos'
import { takenText } from '@/components/photos/photosText'

const DOWNLOAD_ICON = `<svg class="pswp__icn" viewBox="0 0 32 32" aria-hidden="true" style="fill:none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7v13M10.5 15l5.5 5.5 5.5-5.5M8 24.5h16"/></svg>`

// Full-screen viewer of an album's photos (PhotoSwipe) — SPEC §3.3. Shows the
// previews, zooms in from the clicked thumbnail, swipes and pinch-zooms on
// phones. The open photo is kept in the URL (`?photo={id}`): a link opens it,
// and the back button closes it. `photos` = the photos in display order.
export function usePhotoLightbox(photos) {
  const route = useRoute()
  const router = useRouter()
  const current = () => (typeof route.query.photo === 'string' ? route.query.photo : null)
  const withPhoto = (photo) => ({ query: { ...route.query, photo: photo ?? undefined } })

  let pushed = false // the open photo added a history entry (back closes it)

  const lightbox = new PhotoSwipeLightbox({
    pswpModule: () => import('photoswipe'),
    dataSource: [],
    showHideAnimationType: 'zoom',
    bgOpacity: 1,
    loop: false,
    wheelToZoom: true,
    padding: { top: 56, bottom: 56, left: 0, right: 0 },
    closeTitle: 'Zavřít (Esc)',
    zoomTitle: 'Přiblížit',
    arrowPrevTitle: 'Předchozí',
    arrowNextTitle: 'Další',
    errorMsg: 'Fotku se nepodařilo načíst.',
    indexIndicatorSep: ' / ',
  })

  const slides = () =>
    photos.value.map((p) => ({
      id: p.id,
      src: p.previewUrl,
      msrc: p.thumbUrl,
      ...fitWithin(p.width, p.height, PREVIEW_EDGE),
      alt: p.originalFilename,
      photo: p,
    }))

  // Zoom from / back to the thumbnail in the grid.
  lightbox.addFilter('thumbEl', (el, data) => {
    return document.querySelector(`[data-photo-id="${data.id}"] img`) ?? el
  })
  lightbox.addFilter('placeholderSrc', (src, slide) => slide.data.msrc ?? src)

  async function download(button, pswp) {
    const photo = pswp.currSlide?.data.photo
    if (!photo || button.disabled) return
    button.disabled = true
    button.classList.add('pswp__button--busy')
    try {
      const link = document.createElement('a')
      link.href = await originalUrl(photo)
      link.download = photo.originalFilename ?? ''
      link.rel = 'noopener'
      document.body.append(link)
      link.click()
      link.remove()
    } catch (e) {
      console.error('Downloading the original failed', e)
      alert('Originál se nepodařilo stáhnout. Zkuste to prosím znovu.')
    } finally {
      button.disabled = false
      button.classList.remove('pswp__button--busy')
    }
  }

  lightbox.on('uiRegister', () => {
    const { pswp } = lightbox
    pswp.ui.registerElement({
      name: 'download',
      order: 9,
      isButton: true,
      tagName: 'button',
      title: 'Stáhnout originál',
      ariaLabel: 'Stáhnout originál',
      html: `${DOWNLOAD_ICON}<span class="pswp__download-label">Stáhnout originál</span>`,
      onClick: (e, el) => download(el, pswp),
    })
    pswp.ui.registerElement({
      name: 'caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (el) => {
        const update = () => (el.textContent = takenText(pswp.currSlide?.data.photo ?? {}))
        pswp.on('change', update)
        update()
      },
    })
  })

  lightbox.on('change', () => {
    const id = lightbox.pswp.currSlide?.data.id
    if (id && id !== current()) router.replace(withPhoto(id))
  })
  lightbox.on('close', () => {
    if (!current()) return // closed by the back button
    if (pushed) router.back()
    else router.replace(withPhoto(null))
    pushed = false
  })

  function openAt(id) {
    const index = photos.value.findIndex((p) => p.id === id)
    if (index < 0) return false
    const { pswp } = lightbox
    if (pswp) {
      if (pswp.currIndex !== index) pswp.goTo(index)
    } else {
      lightbox.options.dataSource = slides()
      lightbox.loadAndOpen(index)
    }
    return true
  }

  // The URL is the source of truth: opening pushes `?photo=`, back removes it.
  watch(
    [current, () => photos.value.length],
    ([id]) => {
      if (id) {
        // An unknown id (deleted photo, still loading) leaves the URL alone.
        openAt(id)
      } else if (lightbox.pswp) {
        pushed = false
        lightbox.pswp.close()
      }
    },
    { flush: 'post' },
  )
  // Keep the slides in step when photos change while open (leaders deleting).
  watch(photos, () => {
    if (lightbox.pswp) lightbox.options.dataSource = slides()
  })

  onMounted(() => lightbox.init())
  onUnmounted(() => lightbox.destroy())

  return {
    open(photo) {
      pushed = true
      router.push(withPhoto(photo.id))
    },
  }
}
