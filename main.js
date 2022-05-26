const c = document.querySelector("#display");
const ctx = c.getContext("2d");
var size = 10, maxSpeed = 3, detectionDistance = 150, angleBound = [60, -60];
c.width = window.innerWidth;
c.height = window.innerHeight;

var avA = true,
      alA = true,
      coA = true;

var config = {
    showDistanceTracker: false,
    showFishDirection: false,
    preventWallCollision: true,
    goToCenterIfNotFollowing: false,
    showFollowLine: true,
    showOneDetailed: false
}

var sens = {
    v: 1,
    l: 10,
    c: 1
}

var stdout;

const scAngle = deg2Rad(Math.atan2(c.height, c.width));

c.addEventListener("click", function(e){
    if(Fish.instances.length > 50){
        alert("Fish Limit at Maximum");
        return;
    }

    new Fish({
        ctx: ctx,
        position: [e.clientX, e.clientY],
        direction: Math.random() * 360,
        detectionBehavior: avoidCloseWithinACone,
        behaviorEffect: findFreeSpace
    });
})

function isWithinBounds(num, range){
    const [min, max] = [Math.min(...range), Math.max(...range)];

    if(num > min && num < max) return true;
    
    return false;
}

function avoidCloseWithinACone(){

    const aMIncrease = 10;

    for(let fish of Fish.instances){
        if(this.id == fish.id) continue;

        const distance = this.dBF(fish);

        if(distance > detectionDistance) continue;

        const angle = this.aBF(fish);
        
        if(!isWithinBounds(angle, angleBound) && distance > size * 5) continue;

        this.nearFishes.push({obj: fish, dist: distance, angle: angle});
    }

    // TODO WALL PREVENTION
    if(config.preventWallCollision){
        const wd = {
            top: this.position[1],
            bot: c.height - this.position[1],
            left: this.position[0],
            right: c.width - this.position[0]
        }

        for(let i in wd){
            const dist = wd[i];

            if(dist > detectionDistance || dist < 10) continue;

            let aInc = aMIncrease, wallAngle;

            switch(i){
                case "top":
                    wallAngle = this.aBFCoord(this.position[0], 0);
                    break;
                case "bot":
                    wallAngle = this.aBFCoord(this.position[0], c.height);
                    break;
                case "left":
                    wallAngle = this.aBFCoord(0, this.position[1]);
                    break;
                case "right":
                    wallAngle = this.aBFCoord(c.width, this.position[1]);
                    break;
            }
    
            if(wallAngle <= 0) aInc *= -1;
            aInc *= (detectionDistance * maxSpeed * sens.v) / (dist * dist);

            if(aInc > 10) aInc = 10;
    
            this.angularMomentum += aInc;
        }
    }

    if(config.goToCenterIfNotFollowing && this.following == ""){
        const centerAngle = this.aBFCoord(c.width / 2, c.height / 2);

        this.angularMomentum -= (sens.c / 2 * Math.sign(centerAngle)); 
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

            // don't avoid the fish that you are following
            if(fish.obj.id == this.following) continue;

            let aInc = aMIncrease;
    
            if(fish.angle <= 0) aInc *= -1;
            aInc *= (detectionDistance * maxSpeed * sens.v) / (fish.dist * fish.dist);

            if(aInc > 10) aInc = 10;
    
            this.angularMomentum += aInc;

            // accelerate if fish found in the near back
            if(fish.angle > angleBound[0] && fish.angle < (360 - Math.abs(angleBound[1]))){
                this.speed += 1;
            }
        }
    }

    let nearestFish = this.getNearest(this.following);
    if(nearestFish != -1){
        this.following = nearestFish.obj.id;

        // Copy Direction
        if(alA){
            this.angularMomentum += this.getCorrectSteer(nearestFish.obj) / (sens.l * maxSpeed);
        }
    
        // Goto Center of nearest Fish
        if(coA){
            if(nearestFish.angle > 7 || nearestFish.angle < -7){
                this.angularMomentum -= (sens.c / 10000 * Math.sign(nearestFish.angle)) * (nearestFish.dist * nearestFish.dist); 
            }
        }
    }
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