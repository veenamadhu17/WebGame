let playButton = document.getElementById('play');

playButton.addEventListener("mousemove", function() {
    playButton.src = "play button2.png"
})

playButton.addEventListener("mouseout", function() {
    playButton.src = "play button.png"
})