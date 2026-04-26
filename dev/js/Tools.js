class EventChecker {
    constructor() {
        this.events = []
    }


	update() {
	    this.events.forEach((obj, i) => {
	        obj.state
	    });

	}

	start(name, id){

	}

	pause(name, id){

	}

    addEvent(name, type, state){
    // имя, тип, state: paused, process, complete
		
		const currentLogic = this.getLogic(type)

		const event = {
		    name: [id, state, currentLogic]
		};

		this.events.push(event) // все события
    }    

    onStart(type){

    }

    onEnd(){

    }


    getLogic(type){

    	return func
    }

    getRules(state, rules, type){
    	if(type === "switch")
    	if(type === "switch")
    	if(type === "switch")
    }

    switch(type) {
    	return
    }

    ending() {
    }



}

let splineExampleAnim = 0;
let splineExampleActive = true; 
let splineExampleComplete = false;


function updateAlphasEditor() {
    let changed = false;
    const step = 0.02; // Скорость затухания
    const stepb = 0.01; // Скорость затухания

    // 2. Special Message (затухает после отпускания мыши)
    if (!isMouseDown && specialAlpha > 0) {
        specialAlpha -= step;
        if (specialAlpha < 0) specialAlpha = 0;
        changed = true;
    }

    // 3. Paste Message (зависит от внешнего флага pasteMessageActive)
    const targetPaste = pasteMessageActive ? 1 : 0;
    if (Math.abs(pasteAlpha - targetPaste) > 0.01) {
        // Двигаем к цели (плавно или линейно)
        pasteAlpha += (targetPaste > pasteAlpha) ? stepb : -stepb;
        changed = true;
    } else {
        pasteAlpha = targetPaste;
    }

    // Если что-то изменилось, запрашиваем новый кадр отрисовки
    if (changed) {
        if (fadeRequest) cancelAnimationFrame(fadeRequest);
        fadeRequest = requestAnimationFrame(renderEditorCanvas);
    } else {
        fadeRequest = null;
    }
}