const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const midpointDistanceLabel = document.getElementById("midpoint-distance")
const optimalDistanceLabel = document.getElementById("optimal-distance")

const robot = {
    x: 1.5,
    y: 2
}

const speaker = {
    top: {
        x: 1,
        y: 5
    },
    bottom: {
        x: 1,
        y: 4
    },
    safeMargin: 0.2
}

const rayCast = (point, theta, segment1, segment2) => {
    let distance

    const vx = Math.cos(theta)
    const vy = Math.sin(theta)

    if(segment1.x == segment2.x){
        if (vx == 0) return null

        distance = (segment1.x - point.x) / vx
    } else {
        const m = (segment2.y - segment1.y) / (segment2.x - segment1.x)

        if (vy - m * vx == 0) return null

        distance = (m * point.x - m * segment1.x - point.y + segment1.y) / (vy - m * vx)
    }

    const intersectionX = point.x + vx * distance
    const intersectionY = point.y + vy * distance

    if(intersectionX + 0.0001 < Math.min(segment1.x, segment2.x)) return null
    if(intersectionX - 0.0001 > Math.max(segment1.x, segment2.x)) return null
    if(intersectionY + 0.0001 < Math.min(segment1.y, segment2.y)) return null
    if(intersectionY - 0.0001 > Math.max(segment1.y, segment2.y)) return null

    return {
        distance,
        intersection: {
            x: intersectionX,
            y: intersectionY
        }
    }
}

const midpointAngleToSpeaker = () => {
    const midpoint = {
        x: 0.5 * (speaker.bottom.x + speaker.top.x),
        y: 0.5 * (speaker.bottom.y + speaker.top.y)
    }

    return Math.atan2(midpoint.y - robot.y, midpoint.x - robot.x)
}

const optimalAngleToSpeaker = () => {
    const midpoint = {
        x: 0.5 * (speaker.bottom.x + speaker.top.x),
        y: 0.5 * (speaker.bottom.y + speaker.top.y)
    }

    const midpointAngle = Math.atan2(midpoint.y - robot.y, midpoint.x - robot.x)
    const speakerNormal = Math.atan2(speaker.top.x - speaker.bottom.x, speaker.top.y - speaker.bottom.y)
    const speakerParallel = Math.atan2(speaker.top.y - speaker.bottom.y, speaker.top.x - speaker.bottom.x)
    const speakerBottomWithSafeMargin = {
        x: speaker.bottom.x + speaker.safeMargin * Math.cos(speakerParallel),
        y: speaker.bottom.y + speaker.safeMargin * Math.sin(speakerParallel)
    }
    const speakerTopWithSafeMargin = {
        x: speaker.top.x - speaker.safeMargin * Math.cos(speakerParallel),
        y: speaker.top.y - speaker.safeMargin * Math.sin(speakerParallel)
    }

    const squareShotAngle = Math.cos(midpointAngle - speakerNormal) < 0 ? speakerNormal + Math.PI : speakerNormal

    const squareShotTrajectory = rayCast(robot, squareShotAngle, speakerBottomWithSafeMargin, speakerTopWithSafeMargin)

    if (squareShotTrajectory) return squareShotAngle

    // optimize with sin method

    const sinRobotToSpeaker = Math.sin(midpointAngle - speakerNormal)

    const adjustmentMultiplier = 0.5 * Math.hypot(speaker.top.x - speaker.bottom.x, speaker.top.y - speaker.bottom.y) - speaker.safeMargin

    const adjustedTarget = {
        x: midpoint.x + adjustmentMultiplier * sinRobotToSpeaker * Math.cos(speakerParallel),
        y: midpoint.y + adjustmentMultiplier * sinRobotToSpeaker * Math.sin(speakerParallel)
    }

    return Math.atan2(adjustedTarget.y - robot.y, adjustedTarget.x - robot.x)
}

const scaleFactor = 60
const draw = () => {
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.lineWidth = 2
    ctx.strokeStyle = "black"
    ctx.beginPath()
    ctx.moveTo(scaleFactor * speaker.bottom.x, canvas.height - scaleFactor * speaker.bottom.y)
    ctx.lineTo(scaleFactor * speaker.top.x, canvas.height - scaleFactor * speaker.top.y)
    ctx.closePath()
    ctx.stroke()

    ctx.fillStyle = "black"
    ctx.beginPath()
    ctx.arc(scaleFactor * speaker.bottom.x, canvas.height - scaleFactor * speaker.bottom.y, 3, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(scaleFactor * speaker.top.x, canvas.height - scaleFactor * speaker.top.y, 3, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    const midpointTheta = midpointAngleToSpeaker()
    const midpointShotTrajectory = rayCast(robot, midpointTheta, speaker.bottom, speaker.top)

    if (midpointShotTrajectory) {
        ctx.lineWidth = 1
        ctx.strokeStyle = "red"
        ctx.beginPath()
        ctx.moveTo(scaleFactor * robot.x, canvas.height - scaleFactor * robot.y)
        ctx.lineTo(scaleFactor * midpointShotTrajectory.intersection.x, canvas.height - scaleFactor * midpointShotTrajectory.intersection.y)
        ctx.closePath()
        ctx.stroke()

        midpointDistanceLabel.innerHTML = "Midpoint Distance: " + midpointShotTrajectory.distance.toFixed(2)
    } else {
        midpointDistanceLabel.innerHTML = "Midpoint Distance: N/A"
    }

    const optimalTheta = optimalAngleToSpeaker()
    const optimalShotTrajectory = rayCast(robot, optimalTheta, speaker.bottom, speaker.top)

    if (optimalShotTrajectory) {
        ctx.lineWidth = 1
        ctx.strokeStyle = "green"
        ctx.beginPath()
        ctx.moveTo(scaleFactor * robot.x, canvas.height - scaleFactor * robot.y)
        ctx.lineTo(scaleFactor * optimalShotTrajectory.intersection.x, canvas.height - scaleFactor * optimalShotTrajectory.intersection.y)
        ctx.closePath()
        ctx.stroke()

        optimalDistanceLabel.innerHTML = "Optimal Distance: " + optimalShotTrajectory.distance.toFixed(2)
    } else {
        optimalDistanceLabel.innerHTML = "Optimal Distance: N/A"
    }

    ctx.fillStyle = "blue"
    ctx.beginPath()
    ctx.arc(scaleFactor * robot.x, canvas.height - scaleFactor * robot.y, 4, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
}

draw()

canvas.addEventListener("mousemove", (e) => {
    robot.x = e.offsetX / scaleFactor
    robot.y = (canvas.height - e.offsetY) / scaleFactor

    draw()
})