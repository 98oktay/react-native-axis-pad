import React, { Component } from 'react';
import { Animated, Easing, Platform, Text } from 'react-native';
import AxisPadStyle from './AxisPadStyle';

export default class AxisPad extends Component {
    constructor(props) {
        super(props);
        this.anim_cx = new Animated.Value(0);
        this.anim_cy = new Animated.Value(0);
        this.anim_px = new Animated.Value(0);
        this.anim_py = new Animated.Value(0);

        this.state = {
            identifier: 0,
            cx: 0,
            cy: 0,
            sx: 0,
            sy: 0,
            px: 0,
            py: 0,
            dx: 0,
            dy: 0,
            width: props.size ? props.size : 300,
            handler: props.handlerSize ? props.handlerSize : 100,
            step: props.step ? props.step : 0
        };

        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onTouchCancel = this.onTouchCancel.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.limitter = this.limitter.bind(this);
        this.sendValue = this.sendValue.bind(this);
        this.centerPosition = this.centerPosition.bind(this);
        this.animate = this.animate.bind(this);
        this.centerAnimate = this.centerAnimate.bind(this);
        this.setPosition = this.setPosition.bind(this);
    }

    centerAnimate() {
        Animated.timing(
            this.anim_cx,
            {
                toValue: this.state.cx,
                duration: 300,
                easing: Easing.elastic()
            }
        ).start();
        Animated.timing(
            this.anim_cy,
            {
                toValue: this.state.cy,
                duration: 300,
                easing: Easing.elastic()
            }
        ).start();
    }

    animate() {
        Animated.timing(
            this.anim_px,
            {
                toValue: this.state.px,
                duration: 50,
                easing: Easing.out(Easing.exp)
            }
        ).start();
        Animated.timing(
            this.anim_py,
            {
                toValue: this.state.py,
                duration: 50,
                easing: Easing.out(Easing.exp)
            }
        ).start()
    }

    limitter(input) {
        const { width, step } = this.state;
        const minimised = input / width * 2
        const stepped = (x) => step ? Math.floor(x / step) * step : x;
        const limited = (x) => Math.min(1, Math.max(-1, x));
        return stepped(limited(minimised)) * width / 2;
    }

    sendValue(x, y) {
        const { width } = this.state;
        this.props.onValue && this.props.onValue({ x: x / width * 2, y: y / width * 2 });
    }

    centerPosition(pageX, pageY) {
        this.handlerElement._component.measure((fx, fy, width, height, px, py) => {
            cx = pageX - px - width / 2
            cy = pageY - py - height / 2
            this.setState({
                cx,
                cy
            }, this.centerAnimate);
        })
    }

    setPosition(pageX, pageY, after) {
        let { dx, dy } = this.state;
        this.wrapperElement._component.measure((fx, fy, width, height, px, py) => {
            const cx = px + width / 2;
            const cy = py + height / 2;
            this.setState({
                sx: cx,
                sy: cy,
                px: this.props.lockX ? 0 : pageX - cx,
                py: this.props.lockY ? 0 : pageY - cy
            }, after);
        })
    }

    getTouchPoint(touches, identifier) {
        let touchItem = null;

        touches.map((item) => {
            if (item.identifier === identifier) {
                touchItem = item;
            }
        });

        return touchItem;
    }

    onTouchStart(evt) {

        const identifier = evt.nativeEvent.identifier;
        const touchItem = this.getTouchPoint(evt.nativeEvent.touches, identifier);
        console.log(evt.nativeEvent.touches, identifier, touchItem);

        if (typeof identifier === "number" && touchItem) {
            const { pageX, pageY } = touchItem;

            if (this.props.autoCenter) {
                this.centerPosition(pageX, pageY);
                this.sendValue(this.state.px, this.state.py);
                this.setState({
                    identifier,
                    sx: pageX,
                    sy: pageY
                });
            } else {
                this.setPosition(pageX, pageY, () => {
                    this.sendValue(this.state.px, this.state.py);
                    this.animate();
                })
            }
        }
    }

    onTouchMove(evt) {
        const touchItem = this.getTouchPoint(evt.nativeEvent.touches, this.state.identifier);
        if (touchItem) {
            const { pageX, pageY } = touchItem;

            let px = this.props.lockX ? 0 : pageX - this.state.sx + this.state.dx;
            let py = this.props.lockY ? 0 : pageY - this.state.sy + this.state.dy;

            px = this.props.lockX ? 0 : this.limitter(px);
            py = this.props.lockY ? 0 : this.limitter(py);
            this.sendValue(px, py);
            this.setState({ px, py }, this.animate);
        }
    }

    onTouchEnd() {
        let { px, py } = this.state;
        let dx, dy;
        if (this.props.resetOnRelease) {
            px = 0;
            py = 0;
        }
        if (this.props.autoCenter) {
            dx = px;
            dy = py;
        } else {
            dx = 0;
            dy = 0;
        }
        this.sendValue(px, py);
        this.setState({
            cx: 0,
            cy: 0,
            px,
            py,
            dx,
            dy
        }, () => {
            this.centerAnimate();
            this.animate();
        });
    }

    onTouchCancel() {
        this.setState({
            cx: 0,
            cy: 0
        }, this.centerAnimate);
    }

    render() {
        return (
            <Animated.View onTouchStart={this.onTouchStart}
                onTouchEnd={this.onTouchEnd}
                onTouchCancel={this.onTouchCancel}
                onTouchMove={this.onTouchMove}
                style={[AxisPadStyle.wrapper, this.props.wrapperStyle ? this.props.wrapperStyle : {}, {
                    width: this.state.width,
                    height: this.state.width,
                    transform: [{
                        translateX: this.anim_cx,
                    }, {
                        translateY: this.anim_cy
                    }]
                }]}
                ref={view => { this.wrapperElement = view; }}>
                <Animated.View
                    ref={view => { this.handlerElement = view; }}
                    style={[AxisPadStyle.handler, this.props.handlerStyle ? this.props.handlerStyle : {}, {
                        width: this.state.handler,
                        height: this.state.handler,
                        transform: [{
                            translateX: this.anim_px,
                        }, {
                            translateY: this.anim_py
                        }]
                    }]}>
                    {this.props.children}
                </Animated.View>
            </Animated.View>
        )
    }
}