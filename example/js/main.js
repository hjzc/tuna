"useStrict";
//http://freesound.org/people/TexasMusicForge/sounds/2684/
webkitAudioContext && 
(this.onload = function () {
    var context = new webkitAudioContext(),
        tuna = new Tuna(context), 
        player = document.getElementById('player'),
        sourceNode = context.createMediaElementSource(player),
        names = ["Compressor","Filter","Cabinet","Chorus","Convolver","Delay","Overdrive",/*"Phaser","Tremolo","WahWah"*/],
        proto = "prototype",
        tabs = Object.create(null),
        effects = Object.create(null),
        mouse = {}, 
        TAU = Math.PI * 2,
        slice = TAU / 12,
        knobRadius = 20,
        movingKnob = false,
        activeEffect,
        knobNames,
        ctx;
    function Tab (parent, name) {
        var tab = document.createElement("div"),
            anch = document.createElement("a"),
            text = document.createTextNode(name);
        tab.classList.add("tab");
        anch.setAttribute("id", name + "_tab");
        anch.classList.add("tabAnchor");
        anch.appendChild(text);
        tab.appendChild(anch);
        parent.appendChild(tab);
        return tab;
    }
    function CheckBox (x, y, name, index) {
        this.active = false;
        this.x = x;
        this.y = y;
        this.name = name;
        this.index = index;
        this.type = "CheckBox";
        this.draw();
    }
    CheckBox.prototype = Object.create(null, {
        width: {value: knobRadius * 2},
        draw: {
            value: function () {
                ctx.rectangle(this.x, this.y, this.width, this.width, "#444");
                if (this.active) {
                    ctx.line(this.x, this.y, this.x + this.width, this.y + this.width);
                    ctx.line(this.x, this.y + this.width, this.x + this.width, this.y);
                }
            }
        }
    });
    function Knob (x, y, name, index) {
        this.theta = 0;
        this.x = x + 20; 
        this.y = y + 20;
        this.name = name;
        this.index = index;
        this.type = "Knob";
        this.draw();
    }
    Knob.prototype = Object.create(null, {
        r: {value: knobRadius},
        upperLimit: {value: slice * 10},
        draw: {
            value: function (y) {
                var x2 = this.x + this.r * Math.cos(this.theta + slice * 4),
                    y2 = this.y + this.r * Math.sin(this.theta + slice * 4);
                
                ctx.circle(this.x, this.y, this.r, "#EEE", "#444");
                ctx.line(this.x, this.y, x2, y2);
            }
        }
    });
    function Interface (name) {
        var prop, 
            offset = 45;
        ctx.clear();
        this.controls = {};
        this.controlsByIndex = [];
        for (var i = 0, ii = knobNames.length; i < ii; i++) {
            knobNames[i].innerText = "";
        }
        i = 0;
        for (var def in Tuna[proto][name][proto].defaults) {
            prop = Tuna[proto][name][proto].defaults[def];
            switch (prop.type) {
                case "boolean":
                    this.controls[def] = new CheckBox(offset, 10, def, i);
                    this.controlsByIndex.push(this.controls[def]);
                    break;
                case "float":
                    this.controls[def] = new Knob(offset, 10, def, i);
                    this.controlsByIndex.push(this.controls[def]);
                    break;
                case "int":
                    this.controlsByIndex.push({draw: function (){}});
                    break;
                case "string":
                    this.controlsByIndex.push({draw: function (){}});
                    break;
                default: 
                    this.controlsByIndex.push({draw: function (){}});
            }
            offset += 90;
            knobNames[i] && (knobNames[i].innerText = def);
            i++;
        }
    }
    Interface.prototype = Object.create(null, {
        drawControls: {
            value: function (y) {
                ctx.clear();
                for (var i = 0, ii = this.controlsByIndex.length; i < ii; i++) {
                    this.controlsByIndex[i].draw();
                }
            }
        }
    });
    function down (e) {
        if (e.srcElement.classList.contains("tabAnchor")) {
            tabDown(e);
            return;
        }
        if (e.srcElement.id === "interface_canvas") {
            interfaceDown(e);
            return;
        }
    } 
    function up (e) {
        movingKnob = false;
    }
    function move (e) {
        if (!movingKnob) {return}
        var y = e.pageY;
        activeKnob.theta += (mouse.lastY - y > 0 ? 0.15 : -0.15);

        if (activeKnob.theta > activeKnob.upperLimit) {
            activeKnob.theta = activeKnob.upperLimit;
        }
        if (activeKnob.theta < 0) {
            activeKnob.theta = 0;
        }
        activeEffect.drawControls(y);
        mouse.lastY = y;
    }
    function tabDown (e) {
        var el = e.srcElement;
        if (tabDown.previous) {
            document.getElementById(tabDown.previous).classList.remove("activeTab");
        }
        el.classList.add("activeTab");
        activeEffect = el.id.replace("_tab", "");
        deactivateAll();
        effects[activeEffect].bypass = false;
        activeEffect = new Interface(activeEffect);
        tabDown.previous = el.id;
    }
    function deactivateAll () {
        for (var i = 0, ii = names.length; i < ii; i++) {
            effects[names[i]].bypass = true;
        }
    }
    function interfaceDown (e) {
        var effectIndex = ~~(((e.layerX - 20)  / 780) * 8);
        if (activeEffect.controlsByIndex[effectIndex]) {
            switch (activeEffect.controlsByIndex[effectIndex].type) {
                case "Knob":
                    activeKnob = activeEffect.controlsByIndex[effectIndex];
                    movingKnob = true;
                    break;
                case "CheckBox":
                    //activeEffect.controlsByIndex[effectIndex].active = !activeEffect.controlsByIndex[effectIndex].active;
                    activeEffect.controlsByIndex[effectIndex].draw();
                    break;
            }
        }
        mouse.startY = e.pageY; 
        mouse.lastY = e.pageY;
    }
    function init () {
        var name,
            tabsEl = document.getElementById("tabs"),
            inter = document.getElementById("interface"),
            interface_canvas = document.getElementById("interface_canvas"),
            temp = inter.getBoundingClientRect();
        window.ef = effects
        knobNames = document.getElementsByClassName("name");
        interface_canvas.width = 800;
        interface_canvas.height = 55;
        ctx = interface_canvas.getContext("2d");
        ctx.lineWidth = 3;
        for (var i = 0, ii = names.length; i < ii; i++) {
            name = names[i];
            effects[name] = new tuna[name]();
            if (i) {
                effects[names[i - 1]].connect(effects[names[i]].input);
            }
            tabs[name] = Tab(tabsEl, name);
        }
        effects[name].connect(context.destination);
        document.addEventListener("mousedown", down);
        document.addEventListener("mouseup", up);
        document.addEventListener("mousemove", move);
        tabDown.previous = "Compressor_tab";
        document.getElementById("Compressor_tab").classList.add("activeTab");
        deactivateAll();
    }
    init();
    sourceNode.connect(effects[names[0]].input);  
});
CanvasRenderingContext2D.prototype.line = function(x1, y1, x2, y2) {
     this.lineCap = 'round';
     this.beginPath();
     this.moveTo(x1, y1);
     this.lineTo(x2, y2);
     this.closePath();
     this.stroke();
};
CanvasRenderingContext2D.prototype.circle = function(x, y, r, stroke, fill) {
    this.beginPath();
    this.arc(x, y, r, 0, Math.PI * 2, true);
    this.closePath();
    if (stroke) {
        this.strokeStyle = stroke;
    }
    if (fill) {
        this.fillStyle = fill;
        this.fill();
        this.stroke();
    } else {
        this.stroke();
    }
};
CanvasRenderingContext2D.prototype.rectangle = function(x, y, w, h, fill) {
    this.beginPath();
    this.rect(x, y, w, h);
    this.closePath();
    if (fill) {
        this.fillStyle = fill;
        this.fill();
        this.stroke();
    } else {
        this.stroke();
    }
};
CanvasRenderingContext2D.prototype.triangle = function(p1, p2, p3, fill) {
    // Stroked triangle.
    this.beginPath();
    this.moveTo(p1.x, p1.y);
    this.lineTo(p2.x, p2.y);
    this.lineTo(p3.x, p3.y);
    this.closePath();
    if (fill) {
        this.fillStyle = fill;
        this.fill();
    } else {
        this.stroke();
    }
};
CanvasRenderingContext2D.prototype.clear = function() {
    this.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
};