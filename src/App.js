import { Lightning, Utils } from '@lightningjs/sdk'
import LongTextScroller from '@/Components/LongTextScroller'

const config = {
  bgColor: 0xff2d3748,
  margin: 400,
}

export default class App extends Lightning.Component {
  static getFonts() {
    return [{ family: 'Regular', url: Utils.asset('fonts/Roboto-Regular.ttf') }]
  }

  static _template() {
    return {
      w: 1920,
      h: 1080,
      color: config.bgColor,
      rect: true,
      Wrapper: {
        x: config.margin,
        w: w => w - config.margin * 2,
        h: h => h,
        Content: {
          w: w => w,
          Scroll: {
            type: LongTextScroller,
            w: 1920 - config.margin * 2,
            h: 1080 - 120,
            y: 120,
          },
        },
        Gradients: {
          w: w => w,
          h: h => h,
          Top: {
            rect: true,
            h: 180,
            w: w => w,
            colorTop: config.bgColor,
            colorBottom: 0x00000000,
          },
          Bottom: {
            y: h => h - 180,
            rect: true,
            h: 180,
            w: w => w,
            colorBottom: config.bgColor,
            colorTop: 0x00000000,
          },
        },
      },
    }
  }

  _handleUp() {
    this._hasFocus = 'Scroll'
  }

  _init() {
    fetch(Utils.asset('data/rotterdam.txt'))
      .then(result => result.text())
      .then(text => {
        this._hasFocus = 'Scroll'
        this.tag('Scroll').text = text
      })

    this.tag('Scroll').format = {
      fontFace: 'Regular',
      fontSize: 32,
      lineHeight: 48,
    }
  }

  _getFocused() {
    return this._hasFocus && this.tag(this._hasFocus)
  }
}
