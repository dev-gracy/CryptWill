import heroImage from '../../assets/hero.png';

export default function HeroPortal() {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto overflow-hidden rounded-[2rem] border border-brand/15 shadow-[0_48px_100px_-30px_rgba(155,94,79,0.28)]">
      <img
        src={heroImage}
        alt="CryptWill vault and scenic background"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
