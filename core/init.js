// 1. Слушаем ошибки загрузки ресурсов (img, script, link)

window.addEventListener('error', function (e) {
    // Проверяем, что ошибка именно в теге, у которого есть src или href
    if (e.target && (e.target.src || e.target.href)) {
        const fileName = (e.target.src || e.target.href).split('/').pop();
        console.warn("Emergency: Не найден файл ->", fileName);

        // Если не загрузился критический JS (main или классы)
        if (fileName.includes('main') || fileName.includes('Procedure')) {
            const msg = document.createElement('div');
            msg.style = "position:fixed;top:0;left:0;width:100%;background:red;color:white;padding:10px;z-index:9999;text-align:center;";
            msg.innerHTML = `<b>Критическая ошибка:</b> Файл <u>${fileName}</u> не найден. Если вы сохранили страницу на диск, она может не работать.`;
            document.documentElement.appendChild(msg);
        }
    }
}, true); // КРИТИЧНО: позволяет поймать событие на этапе погружения