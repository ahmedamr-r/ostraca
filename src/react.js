"use client";
/* <Ostraca name="wall" state="loading" value={0.4} />
   Server rendering gets the full drawing from render(); in the browser the
   same markup is adopted by mount(), and prop changes go through update(),
   so they animate instead of re-drawing. Import "ostraca/styles.css" once. */
import { createElement, useEffect, useRef } from "react";
import { render, mount } from "./index.js";

export function Ostraca(props) {
  const { name, as = "div", className, style, ...opts } = props;
  const ref = useRef(null);
  const api = useRef(null);
  const html = useRef(null);
  // The markup is set once; after that React leaves it to mount().
  if (html.current === null) html.current = { __html: render(name, opts) };

  useEffect(() => {
    api.current = mount(ref.current, name, opts);
    return () => { api.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof name === "string" ? name : name?.name]);

  const f = opts.figure;
  useEffect(() => {
    api.current?.update(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.state, opts.value, opts.rev, f?.value, f?.unit, opts.crew, opts.lettered, opts.title, opts.decorative, opts.dir, opts.color, opts.crewColor, opts.paperColor]);

  return createElement(as, {
    ref,
    className: className ? `ostraca-host ${className}` : "ostraca-host",
    style,
    dangerouslySetInnerHTML: html.current,
    suppressHydrationWarning: true,
  });
}

export default Ostraca;
