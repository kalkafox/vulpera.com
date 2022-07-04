const Video = () => {
  return (
    <video
      playsInline={true}
      autoPlay
      muted
      loop
      className="object-cover w-full h-full sepia-[.25] saturate-150 blur-sm scale-[1.1]">
      <source type="video/mp4" src="/bg/voldun_4.mp4"></source>
    </video>
  );
};

export default Video;
