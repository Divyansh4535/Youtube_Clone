const formateTime = (second) => {
    const hrs = Math.floor(second / 3600);
    const mins = Math.floor((second % 3600) / 60);
    const secs = Math.floor(second % 60);
    return `${hrs ? hrs + 'h ' : ''}${mins ? mins + 'm ' : ''}${secs}s`;

    // return [
    //     hrs.toString().padStart(2, 0),
    //     mint.toString().padStart(2, 0),
    //     sec.toString().padStart(2, 0),
    // ].join(":");
};

export { formateTime }