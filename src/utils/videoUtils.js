export const parseVideoUrl = (url) => {
    if (!url) return null;

    // YouTube
    let regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([\w-]{11})/;
    let match = url.match(regex);
    if (match) {
        return { provider: 'youtube', id: match[1] };
    }

    // Vimeo
    regex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/;
    match = url.match(regex);
    if (match) {
        return { provider: 'vimeo', id: match[2] };
    }

    return null; // Неизвестный провайдер
};