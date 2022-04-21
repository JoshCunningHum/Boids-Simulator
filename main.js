const c = document.querySelector("#display");
const ctx = c.getContext("2d");
var size = 10, maxSpeed = 3, detectionDistance = 130, angleBound = [120, -120];
c.width = window.innerWidth;
c.height = window.innerHeight;

var avA = true,
      alA = true,
      coA = true;

var config = {
    showDistanceTracker: false,
    showFishDirection: false,
    preventWallCollision: false
}

var sens = {
    v: 0.5,
    l: 4,
    c: 4
}

var stdout;

c.addEventListener("click", function(e){
    new Fish({
        ctx: ctx,
        position: [e.clientX, e.clientY],
        direction: Math.random() * 360,
        detectionBehavior: avoidCloseWithinACone,
        behaviorEffect: findFreeSpace
    })
})

function isWithinBounds(num, range){
    const [min, max] = [Math.min(...range), Math.max(...range)];

    if(num > min && num < max) return true;
    
    return false;
}

function avoidCloseWithinACone(){

    for(let fish of Fish.instances){
        if(this.id == fish.id) continue;

        const distance = this.dBF(fish);

        if(distance > detectionDistance) continue;

        const angle = this.aBF(fish);
        
        if(!isWithinBounds(angle, angleBound) && distance > size * 5) continue;

        this.nearFishes.push({obj: fish, dist: distance, angle: angle});
    }

    if(this.nearFishes.length > 0) return true;

    return false;
}

function goSlightLeft(){
    this.angularMomentum = -5;
}

function findFreeSpace(){
    const aMIncrease = 5;

    if(this.nearFishes.length == 0) return;

    // Avoid Collision

    if(avA){

        for(let fish of this.nearFishes){
            let aInc = aMIncrease;
    
            if(fish.angle <= 0) aInc *= -1;
            aInc *= (detectionDistance * maxSpeed * 2) / (fish.dist * fish.dist);

            if(aInc > 10) aInc = 10;
    
            this.angularMomentum += aInc;

            // accelerate if fish found in the near back
            if(fish.angle > angleBound[0] && fish.angle < (360 - Math.abs(angleBound[1]))){
                this.speed += 1;
            }
        }
    }

    let nearestFish = this.getNearest((this.following ? [this.following] : []));
    if(nearestFish == -1) return;

    this.following = nearestFish.obj.id;

    // Goto Center of nearest Fish
    if(coA){
        this.angularMomentum -= (nearestFish.angle / (sens.c * maxSpeed)); 
    }

    // Copy Direction
    if(alA){
        this.angularMomentum -= (this.direction - nearestFish.obj.direction) /  (sens.l * maxSpeed);
    }

    // TODO WALL PREVENTION

}

function render(){
    requestAnimationFrame(render);
    ctx.clearRect(0, 0, c.width, c.height);
    Fish.moveAll();
    Fish.drawAll();
}
render();

document.querySelectorAll(".ruleToggler").forEach(e => {
    e.addEventListener("click", function(){
        const type = this.dataset.type;
        let state;
        switch(type){
            case "avA":
                avA = !avA;
                state = avA;
                break;
            case "alA":
                alA = !alA;
                state = alA;
                break;
            case "coA":
                coA = !coA;
                state = coA;
                break;
        }

        if(state){
            this.classList.remove("btn-danger");
            this.classList.add("btn-sucess");
            this.innerHTML = "Enabled";
        }else{
            this.classList.add("btn-danger");
            this.classList.remove("btn-sucess");
            this.innerHTML = "Disabled";
        }
    })
})