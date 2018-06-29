/*jshint esversion: 6 */

// clock countdown
let countdown = {
    minutes: '5',
    seconds: '00'
};

let timer;
// socket events for clock countdown
module.exports.socketEvents = io => {
    io.on('connection', socket => {
        /* disconnect */
        socket.on('disconnect', () => {
            countdown = {
                minutes: '0',
                seconds: '00'
            };
            clearInterval(timer);
        });
        /* trigger event and emit data */
        socket.on('trigger-connection', triggerMessage => {
            if (triggerMessage === 'start-countdown') {
                // end time outside interval 
                const end = new Date();
                end.setTime(end.getTime() + (5 * 60 * 1000));
                // Update the count down every 1 second
                timer = setInterval(() => {
                    // current time, absctucts seconds from end time
                    const now = new Date();
                    // Find the distance between now an the count down date
                    const distance = end.getTime() - now.getTime();
                    // Time calculations for days, hours, minutes and seconds                                        
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    if (seconds < 10) {
                        countdown = {
                            minutes: minutes.toString(),
                            seconds: '0' + seconds.toString(),
                        };
                    } else {
                        countdown = {
                            minutes: minutes.toString(),
                            seconds: seconds.toString(),
                        };
                    }
                    // emit                    
                    socket.emit('time-event', countdown);
                    // stop interval when count down is done
                    if (distance < 1000) {
                        clearInterval(timer);
                    }
                }, 1000);
            }
        });
    });
};