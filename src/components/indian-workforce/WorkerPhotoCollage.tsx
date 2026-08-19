import constructionImg from "@/assets/trade-construction.jpg";
import electricalImg from "@/assets/trade-electrical.jpg";
import welderImg from "@/assets/trade-welder.jpg";
import heroImg from "@/assets/hero-indian-workers.jpg";
import { motion } from "framer-motion";

const collage = [
  {
    src: constructionImg,
    alt: "Indian construction workers in safety gear on a building site",
    className: "col-span-7 row-span-2",
    position: "center 35%",
  },
  {
    src: electricalImg,
    alt: "Indian electrician working on a control panel",
    className: "col-span-5",
    position: "center 25%",
  },
  {
    src: welderImg,
    alt: "Indian welder holding a welding helmet",
    className: "col-span-5",
    position: "center 20%",
  },
] as const;

export default function WorkerPhotoCollage() {
  return (
    <div className="relative">
      <div className="grid aspect-[4/5] grid-cols-12 grid-rows-2 gap-2.5 sm:aspect-[5/4] sm:gap-3 lg:aspect-auto lg:h-[440px]">
        {collage.map((photo, index) => (
          <motion.div
            key={photo.alt}
            className={`relative overflow-hidden rounded-2xl border border-border/50 ${photo.className}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              className="h-full w-full object-cover"
              style={{ objectPosition: photo.position }}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" />
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-2.5 overflow-hidden rounded-2xl border border-border/50 sm:mt-3"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, delay: 0.28 }}
      >
        <div className="relative h-20 overflow-hidden sm:h-24">
          <img
            src={heroImg}
            alt="Indian skilled workers departing for overseas employment"
            className="h-full w-full object-cover object-[center_40%]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/35 to-transparent" />
          <p className="absolute inset-y-0 left-0 flex items-center px-4 font-heading text-xs font-semibold tracking-wide text-white sm:px-5 sm:text-sm">
            India → Verified skills → Global employers
          </p>
        </div>
      </motion.div>
    </div>
  );
}
