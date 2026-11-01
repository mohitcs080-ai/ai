// =====================================================
// VISION AI - OBJECT DETECTION APPLICATION
// =====================================================

let model = null;

let cameraStream = null;

let cameraRunning = false;

let totalDetections = 0;

let totalObjects = 0;

let uniqueObjects = new Set();

let mediaAnalyzed = 0;

let detectionHistory =
    JSON.parse(
        localStorage.getItem("detectionHistory")
    ) || [];

let confidenceThreshold = 0.50;


// =====================================================
// ELEMENTS
// =====================================================

const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const cameraPlaceholder =
    document.getElementById(
        "cameraPlaceholder"
    );


// =====================================================
// LOAD AI MODEL
// =====================================================

async function loadAIModel() {

    try {

        document.getElementById(
            "modelStatus"
        ).innerText =
            "Loading AI Model...";

        document.getElementById(
            "systemStatus"
        ).innerText =
            "Loading model";

        model =
            await cocoSsd.load();

        document.getElementById(
            "modelStatus"
        ).innerText =
            "AI Model Ready";

        document.getElementById(
            "systemStatus"
        ).innerText =
            "Online";

    } catch (error) {

        console.error(error);

        document.getElementById(
            "modelStatus"
        ).innerText =
            "Model Error";

        document.getElementById(
            "systemStatus"
        ).innerText =
            "Offline";

    }

}


// =====================================================
// PAGE NAVIGATION
// =====================================================

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );

        });


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    const page =
        document.getElementById(
            pageName + "Page"
        );

    if (page) {

        page.classList.add(
            "active-page"
        );

    }


    const titles = {

        dashboard:
            [
                "AI Detection Dashboard",
                "Intelligent object detection and monitoring"
            ],

        camera:
            [
                "Live AI Camera",
                "Real-time object detection"
            ],

        upload:
            [
                "Upload Media",
                "Analyze images and videos"
            ],

        history:
            [
                "Detection History",
                "Previous AI detection results"
            ],

        reports:
            [
                "Detection Reports",
                "AI detection analytics"
            ],

        settings:
            [
                "Settings",
                "Configure detection system"
            ]

    };


    if (titles[pageName]) {

        document.getElementById(
            "pageTitle"
        ).innerText =
            titles[pageName][0];

        document.getElementById(
            "pageSubtitle"
        ).innerText =
            titles[pageName][1];

    }


    const nav =
        [...document.querySelectorAll(
            ".nav-item"
        )]
        .find(button =>
            button
            .getAttribute("onclick")
            ?.includes(
                `'${pageName}'`
            )
        );


    if (nav) {

        nav.classList.add("active");

    }


    if (pageName === "history") {

        renderHistory();

    }

    if (pageName === "reports") {

        updateReport();

    }

}


// =====================================================
// CAMERA START
// =====================================================

async function startCamera() {

    if (!model) {

        alert(
            "AI model is still loading."
        );

        return;

    }


    try {

        stopCamera();


        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {
                        width: 1280,
                        height: 720
                    },

                    audio: false

                });


        video.srcObject =
            cameraStream;


        video.style.display =
            "block";


        cameraPlaceholder.style.display =
            "none";


        cameraRunning = true;


        document.getElementById(
            "detectionStatus"
        ).innerText =
            "AI detection active";


        detectCamera();


    } catch (error) {

        console.error(error);

        alert(
            "Camera permission was denied or camera is unavailable."
        );

    }

}


// =====================================================
// CAMERA DETECTION
// =====================================================

async function detectCamera() {

    if (!cameraRunning) {

        return;

    }


    if (
        video.readyState >= 2 &&
        video.videoWidth > 0
    ) {

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const predictions =
            await model.detect(
                video
            );


        const filtered =
            predictions.filter(
                prediction =>
                    prediction.score >=
                    confidenceThreshold
            );


        drawPredictions(
            filtered
        );

        updateCameraResults(
            filtered
        );

    }


    requestAnimationFrame(
        detectCamera
    );

}


// =====================================================
// DRAW PREDICTIONS
// =====================================================

function drawPredictions(
    predictions
) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    predictions.forEach(
        prediction => {

            const [
                x,
                y,
                width,
                height
            ] =
                prediction.bbox;


            const confidence =
                (
                    prediction.score *
                    100
                ).toFixed(1);


            // Bounding box

            ctx.strokeStyle =
                "#00ff66";

            ctx.lineWidth = 3;


            ctx.strokeRect(
                x,
                y,
                width,
                height
            );


            // Label background

            const label =
                `${prediction.class} ${confidence}%`;


            ctx.font =
                "bold 15px Arial";


            const textWidth =
                ctx.measureText(
                    label
                ).width;


            ctx.fillStyle =
                "#00ff66";


            ctx.fillRect(
                x,
                Math.max(
                    0,
                    y - 26
                ),
                textWidth + 12,
                26
            );


            // Label

            ctx.fillStyle =
                "#001b0c";


            ctx.fillText(
                label,
                x + 6,
                Math.max(
                    18,
                    y - 8
                )
            );

        }
    );

}


// =====================================================
// CAMERA RESULTS
// =====================================================

function updateCameraResults(
    predictions
) {

    const container =
        document.getElementById(
            "cameraResults"
        );


    document.getElementById(
        "cameraObjectCount"
    ).innerText =
        predictions.length;


    const unique =
        new Set(
            predictions.map(
                p => p.class
            )
        );


    document.getElementById(
        "cameraUniqueCount"
    ).innerText =
        unique.size;


    container.innerHTML = "";


    if (
        predictions.length === 0
    ) {

        container.innerHTML =
            `<div class="empty-state">
                No objects detected.
            </div>`;

        return;

    }


    predictions.forEach(
        prediction => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "object-item";


            item.innerHTML = `

                <span>
                    📦 ${prediction.class}
                </span>

                <span class="confidence">
                    ${(prediction.score * 100).toFixed(1)}%
                </span>

            `;


            container.appendChild(
                item
            );

        }
    );


    updateStatistics(
        predictions
    );

}


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStatistics(
    predictions
) {

    totalDetections++;

    totalObjects +=
        predictions.length;


    predictions.forEach(
        prediction => {

            uniqueObjects.add(
                prediction.class
            );

        }
    );


    document.getElementById(
        "totalDetections"
    ).innerText =
        totalDetections;


    document.getElementById(
        "objectsFound"
    ).innerText =
        totalObjects;


    document.getElementById(
        "uniqueObjects"
    ).innerText =
        uniqueObjects.size;


    updateRecentObjects(
        predictions
    );

}


// =====================================================
// RECENT OBJECTS
// =====================================================

function updateRecentObjects(
    predictions
) {

    const container =
        document.getElementById(
            "recentObjects"
        );


    if (
        predictions.length === 0
    ) {

        return;

    }


    container.innerHTML = "";


    predictions
        .slice(0, 8)
        .forEach(
            prediction => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "object-item";


                div.innerHTML = `

                    <span>
                        📦 ${prediction.class}
                    </span>

                    <span class="confidence">
                        ${(prediction.score * 100).toFixed(1)}%
                    </span>

                `;


                container.appendChild(
                    div
                );

            }
        );

}


// =====================================================
// STOP CAMERA
// =====================================================

function stopCamera() {

    cameraRunning = false;


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        cameraStream = null;

    }


    video.srcObject = null;

    video.style.display =
        "none";


    cameraPlaceholder.style.display =
        "flex";


    document.getElementById(
        "detectionStatus"
    ).innerText =
        "Camera stopped";


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

}


// =====================================================
// SCREENSHOT
// =====================================================

function captureScreenshot() {

    if (
        !cameraRunning ||
        canvas.width === 0
    ) {

        alert(
            "Start the camera first."
        );

        return;

    }


    const screenshot =
        document.createElement(
            "canvas"
        );


    screenshot.width =
        canvas.width;

    screenshot.height =
        canvas.height;


    const screenshotCtx =
        screenshot.getContext(
            "2d"
        );


    screenshotCtx.drawImage(
        video,
        0,
        0
    );


    screenshotCtx.drawImage(
        canvas,
        0,
        0
    );


    const link =
        document.createElement(
            "a"
        );


    link.download =
        "AI_Detection_" +
        Date.now() +
        ".png";


    link.href =
        screenshot.toDataURL(
            "image/png"
        );


    link.click();

}


// =====================================================
// IMAGE UPLOAD
// =====================================================

document
    .getElementById("imageInput")
    .addEventListener(
        "change",
        handleImageUpload
    );


async function handleImageUpload(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    if (!model) {

        alert(
            "AI model is still loading."
        );

        return;

    }


    const image =
        document.getElementById(
            "uploadedImage"
        );


    const placeholder =
        document.getElementById(
            "uploadPlaceholder"
        );


    image.src =
        URL.createObjectURL(
            file
        );


    image.style.display =
        "block";


    placeholder.style.display =
        "none";


    image.onload =
        async function() {

            const uploadCanvas =
                document.getElementById(
                    "uploadCanvas"
                );


            const uploadCtx =
                uploadCanvas.getContext(
                    "2d"
                );


            uploadCanvas.width =
                image.naturalWidth;


            uploadCanvas.height =
                image.naturalHeight;


            const predictions =
                await model.detect(
                    image
                );


            const filtered =
                predictions.filter(
                    p =>
                        p.score >=
                        confidenceThreshold
                );


            uploadCtx.clearRect(
                0,
                0,
                uploadCanvas.width,
                uploadCanvas.height
            );


            drawUploadPredictions(
                uploadCtx,
                uploadCanvas,
                filtered
            );


            displayUploadResults(
                filtered,
                file.name
            );


            mediaAnalyzed++;

            document.getElementById(
                "mediaAnalyzed"
            ).innerText =
                mediaAnalyzed;


            addHistory(
                "Image",
                filtered
            );

        };

}


// =====================================================
// DRAW IMAGE PREDICTIONS
// =====================================================

function drawUploadPredictions(
    context,
    canvasElement,
    predictions
) {

    predictions.forEach(
        prediction => {

            const [
                x,
                y,
                width,
                height
            ] =
                prediction.bbox;


            const confidence =
                (
                    prediction.score *
                    100
                ).toFixed(1);


            context.strokeStyle =
                "#00ff66";


            context.lineWidth = 4;


            context.strokeRect(
                x,
                y,
                width,
                height
            );


            context.font =
                "bold 18px Arial";


            const label =
                `${prediction.class} ${confidence}%`;


            const textWidth =
                context.measureText(
                    label
                ).width;


            context.fillStyle =
                "#00ff66";


            context.fillRect(
                x,
                y - 30,
                textWidth + 12,
                30
            );


            context.fillStyle =
                "#001b0c";


            context.fillText(
                label,
                x + 6,
                y - 8
            );

        }
    );

}


// =====================================================
// DISPLAY UPLOAD RESULTS
// =====================================================

function displayUploadResults(
    predictions,
    fileName
) {

    const container =
        document.getElementById(
            "uploadResults"
        );


    container.innerHTML = `

        <h3>
            Detection Complete
        </h3>

        <p>
            File:
            <strong>
                ${fileName}
            </strong>
        </p>

        <p>
            Objects detected:
            <strong>
                ${predictions.length}
            </strong>
        </p>

        <hr>

    `;


    predictions.forEach(
        prediction => {

            container.innerHTML += `

                <div class="object-item">

                    <span>
                        📦 ${prediction.class}
                    </span>

                    <span class="confidence">
                        ${(prediction.score * 100).toFixed(1)}%
                    </span>

                </div>

            `;

        }
    );

}


// =====================================================
// VIDEO UPLOAD
// =====================================================

document
    .getElementById("videoInput")
    .addEventListener(
        "change",
        handleVideoUpload
    );


function handleVideoUpload(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    if (!model) {

        alert(
            "AI model is still loading."
        );

        return;

    }


    const uploadedVideo =
        document.getElementById(
            "uploadedVideo"
        );


    const placeholder =
        document.getElementById(
            "uploadPlaceholder"
        );


    uploadedVideo.src =
        URL.createObjectURL(
            file
        );


    uploadedVideo.style.display =
        "block";


    placeholder.style.display =
        "none";


    uploadedVideo.onloadeddata =
        () => {

            detectUploadedVideo(
                uploadedVideo
            );

        };

}


// =====================================================
// VIDEO DETECTION
// =====================================================

async function detectUploadedVideo(
    videoElement
) {

    if (
        videoElement.paused ||
        videoElement.ended
    ) {

        return;

    }


    const uploadCanvas =
        document.getElementById(
            "uploadCanvas"
        );


    const uploadCtx =
        uploadCanvas.getContext(
            "2d"
        );


    uploadCanvas.width =
        videoElement.videoWidth;


    uploadCanvas.height =
        videoElement.videoHeight;


    const predictions =
        await model.detect(
            videoElement
        );


    const filtered =
        predictions.filter(
            p =>
                p.score >=
                confidenceThreshold
        );


    uploadCtx.clearRect(
        0,
        0,
        uploadCanvas.width,
        uploadCanvas.height
    );


    drawUploadPredictions(
        uploadCtx,
        uploadCanvas,
        filtered
    );


    requestAnimationFrame(
        () =>
            detectUploadedVideo(
                videoElement
            )
    );

}


// =====================================================
// HISTORY
// =====================================================

function addHistory(
    source,
    predictions
) {

    const objects =
        predictions.map(
            p => p.class
        );


    const unique =
        new Set(objects);


    const record = {

        date:
            new Date()
                .toLocaleString(),

        source,

        objects:
            objects.length,

        unique:
            unique.size

    };


    detectionHistory.unshift(
        record
    );


    if (
        detectionHistory.length >
        50
    ) {

        detectionHistory =
            detectionHistory.slice(
                0,
                50
            );

    }


    localStorage.setItem(
        "detectionHistory",
        JSON.stringify(
            detectionHistory
        )
    );


    renderHistory();

}


// =====================================================
// RENDER HISTORY
// =====================================================

function renderHistory() {

    const table =
        document.getElementById(
            "historyTable"
        );


    table.innerHTML = "";


    if (
        detectionHistory.length ===
        0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="5"
                    style="text-align:center">

                    No detection history.

                </td>

            </tr>

        `;

        return;

    }


    detectionHistory.forEach(
        record => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${record.date}
                </td>

                <td>
                    ${record.source}
                </td>

                <td>
                    ${record.objects}
                </td>

                <td>
                    ${record.unique}
                </td>

                <td class="success">
                    Completed
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


// =====================================================
// CLEAR HISTORY
// =====================================================

function clearHistory() {

    if (
        !confirm(
            "Clear all detection history?"
        )
    ) {

        return;

    }


    detectionHistory = [];


    localStorage.removeItem(
        "detectionHistory"
    );


    renderHistory();

}


// =====================================================
// REPORT
// =====================================================

function updateReport() {

    document.getElementById(
        "reportTotal"
    ).innerText =
        totalDetections;


    document.getElementById(
        "reportObjects"
    ).innerText =
        totalObjects;


    document.getElementById(
        "reportUnique"
    ).innerText =
        uniqueObjects.size;

}


function downloadReport() {

    const report = `

AI OBJECT DETECTION REPORT
==========================

Generated:
${new Date().toLocaleString()}

Total Detection Frames:
${totalDetections}

Objects Found:
${totalObjects}

Unique Objects:
${uniqueObjects.size}

Detection System:
VisionAI

AI Model:
COCO-SSD / TensorFlow.js

`;

    const blob =
        new Blob(
            [report],
            {
                type:
                    "text/plain"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "AI_Detection_Report.txt";


    link.click();


    URL.revokeObjectURL(
        url
    );

}


// =====================================================
// CONFIDENCE SETTING
// =====================================================

document
    .getElementById(
        "confidenceRange"
    )
    .addEventListener(
        "input",
        function() {

            confidenceThreshold =
                this.value / 100;


            document.getElementById(
                "confidenceValue"
            ).innerText =
                this.value + "%";

        }
    );


// =====================================================
// INITIALIZE
// =====================================================

loadAIModel();

renderHistory();