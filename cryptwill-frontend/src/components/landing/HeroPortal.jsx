import heroImage from '../../assets/hero.png';

export default function HeroPortal() {
  return (
    <div className="relative w-full aspect-square max-w-[680px] mx-auto overflow-hidden rounded-[2.5rem]">
      <img
        src={heroImage}
        alt="CryptWill vault and scenic background"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
