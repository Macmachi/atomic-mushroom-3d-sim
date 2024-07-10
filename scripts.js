/*Créé par Arnaud R. avec l'aide de Claude 3.5 Sonnet*/
let scene, camera, renderer, mushroom;
let step = 0;
const simplex = new SimplexNoise();
let trees = [];
let initialTreePositions = [];
let flashElement;
const flashDuration = 1000; // 1 seconde en millisecondes
let startTime = null;
let animationDuration = 10000; // 10 secondes en millisecondes
let slider;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    mushroom = new THREE.Group();
    scene.add(mushroom);

    // Sol
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);

    // Ajout des arbres
    addTrees();

    camera.position.set(0, 5, 30);
    camera.lookAt(0, 5, 0);

    createMushroomCloud();

    flashElement = document.getElementById('flash');
    slider = document.getElementById('slider');
}

function addTrees() {
    const treeGeometry = new THREE.ConeGeometry(1, 4, 8);
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    
    for (let i = 0; i < 50; i++) {
        const tree = new THREE.Mesh(treeGeometry, treeMaterial);
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 20;
        const position = new THREE.Vector3(
            Math.cos(angle) * radius,
            1,
            Math.sin(angle) * radius
        );
        tree.position.copy(position);
        tree.scale.set(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5);
        scene.add(tree);
        trees.push(tree);
        initialTreePositions.push(position.clone());
    }
}

function createMushroomCloud() {
    const stemGeometry = new THREE.CylinderGeometry(1, 2, 4, 32);
    const stemMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6600,
        emissive: 0xff4500,
        emissiveIntensity: 0.5
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 2;
    mushroom.add(stem);

    const headGeometry = new THREE.SphereGeometry(1, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6600,
        emissive: 0xff4500,
        emissiveIntensity: 0.5
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 4;
    head.scale.set(0.1, 0.1, 0.1);
    mushroom.add(head);

    const cloudGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const cloudMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffcc00,
        transparent: true,
        opacity: 0.8,
        emissive: 0xff8c00,
        emissiveIntensity: 0.3
    });
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.y = 5;
    cloud.scale.set(0.1, 0.1, 0.1);
    mushroom.add(cloud);
}

function updateMushroomShape() {
    const cloud = mushroom.children[2];
    const time = Date.now() * 0.001;
    const positionAttribute = cloud.geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        const length = Math.sqrt(x * x + y * y + z * z);
        const noise = simplex.noise3D(x * 2 + time, y * 2, z * 2);
        const newLength = 1.5 + 0.3 * noise;
        
        positionAttribute.setXYZ(i,
            (x / length) * newLength,
            (y / length) * newLength,
            (z / length) * newLength
        );
    }
    
    positionAttribute.needsUpdate = true;
    cloud.geometry.computeVertexNormals();
}

function updateTrees() {
    const blastRadius = 10 + step * 20;
    trees.forEach((tree, index) => {
        const initialPosition = initialTreePositions[index];
        const distance = Math.sqrt(initialPosition.x ** 2 + initialPosition.z ** 2);
        if (distance < blastRadius) {
            const angle = Math.atan2(initialPosition.z, initialPosition.x);
            const force = (blastRadius - distance) / blastRadius * step;
            tree.position.x = initialPosition.x + Math.cos(angle) * force * 5;
            tree.position.z = initialPosition.z + Math.sin(angle) * force * 5;
            tree.rotation.z = Math.sin(angle) * force;
            tree.rotation.x = Math.cos(angle) * force;
        } else {
            tree.position.copy(initialPosition);
            tree.rotation.set(0, 0, 0);
        }
    });
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    if (!startTime) startTime = currentTime;
    const elapsedTime = currentTime - startTime;
    step = Math.min(elapsedTime / animationDuration, 1);

    if (step <= 1) {
        const stem = mushroom.children[0];
        const head = mushroom.children[1];
        const cloud = mushroom.children[2];

        // Croissance de la tige
        stem.scale.y = 1 + step * 3;
        stem.position.y = 2 + step * 3;

        // Expansion de la tête
        head.scale.set(0.1 + step * 4, 0.1 + step * 3, 0.1 + step * 4);
        head.position.y = 4 + step * 6;

        // Expansion du nuage
        cloud.scale.set(0.1 + step * 6, 0.1 + step * 5, 0.1 + step * 6);
        cloud.position.y = 5 + step * 10;

        updateMushroomShape();
        updateTrees();
        updateInfo();
        updateFlash(elapsedTime);
        
        // Mise à jour du curseur
        slider.value = step * 100;
    }

    mushroom.rotation.y += 0.002;

    renderer.render(scene, camera);
}

function updateInfo() {
    const info = document.getElementById('info');
    if (step < 0.1) {
        info.innerHTML = "Flash atomique : Rayonnement thermique intense et dangereux";
    } else if (step < 0.33) {
        info.innerHTML = "1. Formation de la tige : Colonne d'air ascendante";
    } else if (step < 0.66) {
        info.innerHTML = "2. Expansion de la tête : Zone de haute pression";
    } else {
        info.innerHTML = "3. Formation du nuage : Gaz et débris en expansion";
    }
}

function updateFlash(elapsedTime) {
    if (elapsedTime < flashDuration) {
        flashElement.style.opacity = 1 - (elapsedTime / flashDuration);
    } else {
        flashElement.style.opacity = 0;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

init();
requestAnimationFrame(animate);

// Contrôle du curseur
slider.addEventListener('input', function() {
    const newStep = this.value / 100;
    startTime = performance.now() - (newStep * animationDuration);
    step = newStep;
});