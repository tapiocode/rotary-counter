/**
 * Copyright (c) 2022 tapiocode
 * https://github.com/tapiocode
 * MIT License
 */

customElements.define('rotary-wheel',
  class extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      const wheel = document.createElement('div');
      wheel.classList.add('wheel');

      const stripContainer = document.createElement('div');
      stripContainer.classList.add('strip-container');
      stripContainer.appendChild(this.getStrip());
      wheel.appendChild(stripContainer);

      const style = document.createElement('style');
      this.shadowRoot.append(style);
      this.shadowRoot.append(wheel);
      this.updateStyle();
    }

    updateStyle() {
      this.shadowRoot.querySelector('style').textContent = `
        :host {
          position: relative;
          top: calc(var(--digit-height) * -0.7);
        }
        .strip-container {
          top: -99999px;
          transition-property: top;
          transition-timing-function: ease-in;
          transition-duration: 0.3s;
          position: relative;
        }
        .digit {
          user-select: none;
          background-color: var(--color-wheel);
          color: var(--color-wheel-text);
          font-size: var(--digit-height);
          line-height: var(--digit-height);
          font-weight: normal;
          height: var(--digit-height);
          text-align: center;
          padding: var(--digit-border-width) calc(var(--digit-height) * 0.15);
          border-top: var(--digit-border-width) solid var(--color-wheel-accent);
          border-bottom: var(--digit-border-width) solid var(--color-wheel-shadow);
          border-radius: calc(var(--digit-height) * 0.2);
        }
      `;
    }

    currentDigit = 0;
    overflowingStrip = false;

    getStrip() {
      const strip = document.createElement('div');
      strip.classList.add('strip');
      for (let i = 0; i < 21; i++) {
        const digit = document.createElement('div');
        digit.classList.add('digit');
        digit.appendChild(document.createTextNode((i % 10).toString()));
        strip.appendChild(digit);
      }
      return strip;
    }

    scrollToDigit(digit) {
      const stripContainer = this.shadowRoot.querySelector('.strip-container');
      const digitHeight = this.shadowRoot.querySelector('.digit').getBoundingClientRect().height;
      const targetDigit = digit || 10;
      let targetOffset = getOffset(targetDigit);

      if (this.overflowingStrip) {
        this.overflowingStrip = false;
        setTransitionTop('none', getOffset(this.currentDigit));
      }
      if (targetDigit < (this.currentDigit || 10)) {
        targetOffset += digitHeight * 10;
        this.overflowingStrip = true;
      }
      this.currentDigit = targetDigit % 10;
      setTimeout(function() {
        setTransitionTop(null, targetOffset);
      });

      function getOffset(digit) {
        return digitHeight * digit - digitHeight;
      }

      function setTransitionTop(transition, offset) {
        stripContainer.style.setProperty('transition', transition);
        stripContainer.style.setProperty('top', '-' + offset + 'px');
      }
    }
  }
);

customElements.define('counter-container',
  class extends HTMLElement {

    constructor() {
      super();
      const style = document.createElement('style');
      const container = document.createElement('div');
      container.className = 'container';
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this.shadowRoot.append(container);
      this.shadowRoot.append(style);
      this.updateStyle();
    }

    maxNumber = 0;
    currentNumber = 0;

    initializeClock() {
      const container = this.getContainer();
      this.initializeWheels(6);
      [3, 1].forEach(function(i) {
        container.childNodes[i].insertAdjacentHTML('afterend', '<div class="colon">:</div>');
      });
    }

    initializeWheels(initNum) {
      const targetNum = initNum || numberOfWheels;
      this.maxNumber = 10 ** targetNum;
      this.getContainer().innerHTML = '';
      this.getContainer().insertAdjacentHTML(
        'beforeend',
        Array(targetNum).fill('<rotary-wheel></rotary-wheel>').join('')
      );
    }

    updateStyle() {
      this.shadowRoot.querySelector('style').textContent = `
        :host {
          --digit-height: 3rem;
          --digit-border-width: calc(var(--digit-height) / 7);
        }
        .container {
          border: var(--digit-border-width) solid #888;
          border-radius: calc(var(--digit-height) * 0.2);
          padding: 0 calc(var(--digit-border-width) * 0.5);
          max-height: calc(var(--digit-height) * 3.2);
          height: calc(var(--digit-height) * 3.2);
          position: relative;
          display: inline-flex;
          overflow: hidden;
          column-gap: calc(var(--digit-border-width) * 0.5);
          border-top-color: #555;
          border-bottom-color: #a0a0a0;
          background-color: var(--color-wheel-container);
        }
        .container::before {
          content: '';
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          background:
            linear-gradient(180deg, black, transparent 20%) top,
            linear-gradient(0deg, black, transparent 20%) top;
          z-index: 1;
        }
        .colon {
          position: relative;
          top: 0;
          color: var(--color-colon);
          font-size: var(--digit-height);
          align-self: center;
        }
      `;
    }

    setDigitSize(size) {
      this.shadowRoot.host.style.setProperty('--digit-height', size);
    }

    scrollToNumber(num) {
      const cappedNum = Math.max(0, Math.min(this.maxNumber, num));
      const digits = this.getNumberDigitsArr(cappedNum);
      const wheels = this.getWheels();
      digits.forEach(function(digit, i) {
        if (wheels[i].scrollToDigit) {
          wheels[i].scrollToDigit(digit);
        }
      });
      this.currentNumber = cappedNum % this.maxNumber;
    }

    scrollToNextNumber() {
      this.scrollToNumber(this.currentNumber + 1);
    }

    getNumberDigitsArr(num) {
      const arr = (this.maxNumber + num).toString().split('');
      arr.shift();
      return arr;
    }

    getContainer() {
      return this.shadowRoot.querySelector('.container');
    }

    getWheels() {
      return this.shadowRoot.querySelectorAll('rotary-wheel');
    }
  }
);

const counter = document.getElementById('counter');
const sizes = ['16px', '32px', '64px', '10vw'];
const numbersOfWheels = [3, 5, 8];

let counterContainer = null;
let clockTimer;
let numberOfWheels = 0;

(function initialize() {
  counterContainer = document.createElement('counter-container');
  counter.appendChild(counterContainer);

  sizes.currentIndex = 0;
  numbersOfWheels.currentIndex = 0;
  onClickNumberOfWheels(true);
  onClickResize(true);
  onClickToggleMode();
  onClickToggleTheme();
  counterContainer.scrollToNumber(0);
})();

function onClickToggleMode() {
  if (clockTimer === null) {
    clockTimer = setInterval(function() {
      const hhMmSs = parseInt((new Date()).toTimeString().substring(0, 8).replaceAll(':', ''));
      counterContainer.scrollToNumber(hhMmSs);
    }, 1000);
    counterContainer.initializeClock();
    setElems('CLOCK', 'hidden');
  } else {
    clearInterval(clockTimer);
    clockTimer = null;
    counterContainer.initializeWheels();
    counterContainer.scrollToNumber(0);
    setElems('COUNTER', 'visible');
  }

  function setElems(text, visibility) {
    document.getElementById('clock-toggle').innerText = text;
    document.getElementById('counter-buttons').style.visibility = visibility;
  }
}

function onClickResize() {
  sizes.currentIndex = (sizes.currentIndex + 1) % sizes.length;
  counterContainer.setDigitSize(sizes[sizes.currentIndex]);
  counterContainer.scrollToNumber(0);
}

function onClickToggleTheme() {
  const theme = document.documentElement.getAttribute('theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('theme', theme);
}

function onClickNumberOfWheels() {
  numbersOfWheels.currentIndex = (numbersOfWheels.currentIndex + 1) % numbersOfWheels.length;
  numberOfWheels = numbersOfWheels[numbersOfWheels.currentIndex];
  document.getElementById('column-number').innerText = numberOfWheels;
  counterContainer.initializeWheels();
  counterContainer.scrollToNumber(0);
}

function onClickPlus() {
  counterContainer.scrollToNextNumber();
}

function onClickSet() {
  const num = parseInt(window.prompt('Set Number', '0'));
  if (!isNaN(num)) {
    counterContainer.scrollToNumber(num);
  }
}
