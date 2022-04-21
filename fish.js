function drawTriangle(ctx, position, angle, radius, color = "white"){
    const top = determineCoord(position, angle, radius * 1.5);
    const bLeft = determineCoord(position, angle + 240, radius);
    const bRight = determineCoord(position, angle + 120, radius);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(...top);
    ctx.lineTo(...bLeft);
    ctx.lineTo(...bRight);
    ctx.fill();
}

function deg2Rad(deg){
    return deg / 180 * Math.PI;
}

function rad2Deg(rad){
    return rad * 180 / Math.PI;
}

function determineCoord(origin, angle, length){
    angle = deg2Rad(angle);
    return [origin[0] + Math.cos(angle) * length, origin[1] + Math.sin(angle) * length];
}

const genRand = (len) => {
    return Math.random().toString(36).substring(2,len+2);
}

function getAngleGaps(ang1, ang2){
    ang1 %= 360;
    ang2 %= 360;

    if(ang1 < 0) ang1 = 360 - Math.abs(ang1);
    if(ang2 < 0) ang2 = 360 - Math.abs(ang2);

    const [max, min] = [Math.max(ang1, ang2), Math.min(ang2, ang1)];

    return [ max - min, (360 - max) + min];
}

function aglAbs(angle){
    angle %= 360;

    if(angle < 0){
        return 360 - Math.abs(360);
    }

    return angle;
}

class Fish{
    static instances = [];

    constructor(obj = {
        ctx : null,
        position: [0, 0],
        direction: 0,
        detectionBehavior: null,
        behaviorEffect: null
    }){
        this.position = obj.position;
        this.direction = obj.direction;
        this.detectionBehavior = obj.detectionBehavior;
        this.behaviorEffect = obj.behaviorEffect;
        this.ctx = obj.ctx;
        this.speed = 0;
        this.id = genRand(5);
        this.angularMomentum = 0;
        this.color = "hsl(" + Math.random() * 360 + ", 100%, 75%)";

        this.nearFishes = [];

        if(Fish.instances.length == 0) this.id = "SELECTED";
        Fish.instances.push(this);
    }
    draw(){
        drawTriangle(this.ctx, this.position,this.direction, size, this.color);
    }
    move(){
        this.following = "";
        this.nearFishes.length = 0;
        this.speed = this.speed * 1.01 + 0.1;
        if(this.speed > maxSpeed){
            this.speed = maxSpeed + ((this.speed - maxSpeed) * 0.5)
        }
        this.position = determineCoord(this.position, this.direction, this.speed);
        if(this.position[0] > c.width) this.position[0] = 0;
        else if(this.position[0] < 0) this.position[0] = c.width;

        if(this.position[1] > c.height) this.position[1] = 0;
        else if(this.position[1] < 0) this.position[1] = c.height;

        if(this.id == "SELECTED"){
            
            // Range Finder
            this.ctx.fillStyle = "#999";
            this.ctx.beginPath();
            this.ctx.moveTo(...this.position);
            this.ctx.lineTo(...determineCoord(...this.position, this.direction + angleBound[0], detectionDistance));
            this.ctx.arc(...this.position, detectionDistance, deg2Rad(this.direction + angleBound[0]), deg2Rad(this.direction + angleBound[1]), true);
            this.ctx.closePath();
            this.ctx.fill();
        }

        if(config.showFishDirection || this.id == "SELECTED"){
            this.ctx.strokeStyle = "white";
            this.ctx.beginPath();
            this.ctx.moveTo(...this.position);
            this.ctx.lineTo(...determineCoord(this.position, this.direction, detectionDistance));
            this.ctx.stroke();
        }


        // If Detection Behavior is found 
        if(this.detectionBehavior == null) return;


        const detected = this.detectionBehavior();

        if(detected){
            this.behaviorEffect();
        }

        if(config.showDistanceTracker){
            for(let fish of this.nearFishes){
                this.ctx.strokeStyle = "white";
                this.ctx.lineWidth = ((1/fish.dist) * 200);
                this.ctx.beginPath();
                this.ctx.moveTo(...this.position);
                this.ctx.lineTo(...fish.obj.position);
                this.ctx.stroke();
                this.ctx.closePath();
            }
        }

        
        let rD = (this.direction + this.angularMomentum);
        while(rD < 0) rD = 360 - rD;
        
        this.direction = rD;
        this.angularMomentum /= 2;

        if(this.angularMomentum < 0.1 && this.angularMomentum > -0.1) this.angularMomentum = 0;
        else if(this.angularMomentum > 30) this.angularMomentum = 30;
        else if(this.angularMomentum < -30) this.angularMomentum = -30;

        if(this.id != "SELECTED") return;

            // Closest
            if(this.following && this.nearFishes.length > 0){

                this.ctx.strokeStyle = "crimson";
                this.ctx.beginPath();
                this.ctx.moveTo(...this.position);
                this.ctx.lineTo(...this.nearFishes.find(e => e.obj.id == this.following).obj.position);
                this.ctx.stroke();
            }

        // console.log(detected);
    }
    static drawAll(){
        for(let i = 0; i < Fish.instances.length; i++){
            Fish.instances[i].draw();
        }
    }
    static moveAll(){
        for(let i = 0; i < Fish.instances.length; i++){
            Fish.instances[i].move();
        }
    }
    dBF(target){
        const x = target.position[0] - this.position[0],
              y = target.position[1] - this.position[1];

        return Math.sqrt(x ** 2 + y ** 2);
    }
    aBF(target){
        let angleRes = (this.direction - rad2Deg(Math.atan2(target.position[1] - this.position[1], target.position[0] - this.position[0]))) % 360;

        if(angleRes > 180) angleRes = -(360 - angleRes);

        return angleRes;
    }
    getNearest(exception){
        if(this.nearFishes.length == 0) return -1;

        let target = -1, smallestDist = Infinity;

        for(let fish of this.nearFishes){
            // if(fish.obj.id == "SELECTED") continue;
            if(exception == fish.obj.id) continue;

            if(fish.dist < smallestDist){
                smallestDist = fish.dist;
                target = fish;
            }
        }

        return target;
    }
}