# About:
Браузерный просмотрщик и редактор шрифта<br> 
с возможностью генерации собственного?

[github / release](https://github.com/AleksandrovskyV/fe) - for public<br>
[github / fenelop](https://github.com/AleksandrovskyV/fev) - with workfiles <br>

<br>

## Idea:

Беды приходили ко мне в таком порядке:<br> 

Первая, из нужды конкретного шрифта.   (* 124 page, next? ) <br> 
Вторая, из идеи собрать собственный..  (* fck opensource! ) <br> 
Третья, из мысли сделать инструмент... (* u are seriusly? ) <br> 
<br>

Задачу оформил перед собой так:<br> 
Собрать простой инструмент для быстрой коррекции существующего шрифта (конкретного глифа),<br> 
или с использованием визуального референса сделать черновой набросок семейства. 

Быть может добавить игровую подачу? Мне бы хотелось, чтобы это было интереснее,<br> 
чем инструменты поиска шрифта по reference image.<br> 

SideEffect?  - Восстановление подхода prototypo [`*`](https://vimeo.com/user4849193)<br> 

<br>

### NowFeatures:
- Drag and Drop OTF\TTF fonts
- Generate Font like Prototype Style
- Drag and Drop Reference Image
- Check Variable Fonts
- Special sampleCanvas... or globalCanvas...

<br><br>

### FutureTask:

- Construct Serif-Class...
<br>

![StemConstr](./dev/docs/StemConstrUpdateSite.jpg)

<br><br>

### UsedLibs<br>
Текущий public build содержит только минифицированные библиотеки, для стабильности:<br>

[opentype](https://github.com/opentypejs/opentype.js) / как основа для парсинга font files<br>
[opentype fork](https://github.com/hybridherbst/opentype.js) / её форк с поддержкой Variable Font <br>
[fonteditor](https://kekee000.github.io/fonteditor/index-en.html) / для экспорта в ttf формате <br>
[paper.js](https://github.com/paperjs/paper.js) / для работы с кривыми <br>
[marked](https://github.com/markedjs/marked) / для парсинг readme контента <br>

<br><br>

### Локальное тестирование:<br>
1. Сделать форк или склонировать репозиторий
2. Открыть index.html дабл кликом (но помни, про CORS политику)
3. Если установлен python:<br>
Консольная команда (cmd): python -m http.server<br>
index.html станет дооступна из браузера по адресу: localhost:8000<br>
или : python -m http.server 8080<br>
Cтанет доступна по порту, что вбил<br>


<br><br><br>

### References:

#### Big Font Editors: [FontForge](https://fontforge.org/en-US/), [Glyphs App](https://glyphsapp.com/), [FontLab](https://www.fontlab.com/), [RoboFont](https://robofont.com/)

#### Idea Exploration:<br>
-  wakamaifondue [link](https://wakamaifondue.com/)<br>
- LAIKA: [vimeo](https://vimeo.com/6993808)<br>
- Prototypo App: [vimeo](https://vimeo.com/user4849193) / [github](https://github.com/byte-foundry/prototypo) / [canalblog](https://diplome.canalblog.com/)<br>
- metapolator: [link](http://metapolator.com/developer-tool/)<br>
- LTTRCORP: [Letter "a" with skeletons](https://www.youtube.com/watch?v=hZLzx4JgBKo/) / [PluginUpdate](https://www.youtube.com/watch?v=quxy110JngI/) 

+ Учебник по типографике [link](https://www.youtube.com/watch?v=RGe8OI9pNXY)

<br><br><br>


###  SpecialNote:

####  Процесс сборки форка opentype.js:
... запросил у google ai исправленный package.json файл (актуальный на текущий момент)<br>
npm instal (сборка зависимостей)<br>
npm run build (сборка проекта)<br>
npm run dist (minjs)

<br><br><br>