import { describe, expect, it } from 'vitest';
import { borderRadius, chart, colors, fontSize } from '../../designTokens.js';
import { CARD_FONTS, CARD_SIZE, cardTree } from './cardLayout.js';

// Every element in the tree, depth first.
const walk = node => (node && typeof node === 'object'
    ? [node, ...[].concat(node.props?.children ?? []).flatMap(walk)]
    : []);
const texts = tree => walk(tree).flatMap(n => (typeof n.props?.children === 'string' ? [n.props.children] : []));

const card = {
    path: '/pilot/WD-40', kind: 'Pilot', title: 'WD-40', line: 'Last match Wed, Oct 7, 2026', description: '',
    stats: [1, 2, 3, 4, 5, 6].map(i => ({ label: `L${i}`, value: String(i), note: i === 3 ? 'n3' : undefined }))
};

describe('cardTree', () => {
    it('draws a 1200 × 630 card on the page surface with the brand bar and the site name', () => {
        const tree = cardTree(card);
        expect(CARD_SIZE).toEqual({ width: 1200, height: 630 });
        expect(tree.props.style).toMatchObject({ width: 1200, height: 630, background: colors.surface.page, fontFamily: CARD_FONTS.text });
        expect(walk(tree).some(n => n.props?.style?.background === colors.brand.DEFAULT)).toBe(true);
        expect(texts(tree)).toEqual(expect.arrayContaining(['Pilot', 'overloadfight.club', 'WD-40', 'Last match Wed, Oct 7, 2026']));
    });

    it('shows at most five tiles in the site\'s card colours, radius and small text, at 2.5 times', () => {
        const tiles = walk(cardTree(card)).filter(n => n.props?.style?.background === colors.surface.card);
        expect(tiles).toHaveLength(5);
        expect(tiles[0].props.style).toMatchObject({ border: `2px solid ${colors.line}`, borderRadius: parseFloat(borderRadius.card) * 16 * 2.5 });
        expect(texts(tiles[2])).toEqual(['L3', '3', 'n3']);
        expect(texts(tiles[0])).toEqual(['L1', '1']);
        const small = parseFloat(fontSize['2xs'][0]) * 16 * 2.5;
        expect(walk(cardTree(card)).find(n => n.props?.children === 'Pilot').props.style).toMatchObject({ color: colors.brand.DEFAULT });
        // four tiles keep the S19 sizes
        const four = walk(cardTree({ ...card, stats: card.stats.slice(0, 4) })).filter(n => n.props?.style?.background === colors.surface.card);
        expect(four[0].props.children[0].props.style).toMatchObject({ fontSize: small * 0.9, color: chart.label, letterSpacing: 1 });
    });

    it('sets long titles and values smaller and cuts what still overflows', () => {
        const size = title => walk(cardTree({ ...card, title })).find(n => n.props?.children === title).props.style;
        expect(size('WD-40').fontSize).toBe(88);
        expect(size('LORD JOHN WARFIN').fontSize).toBe(72);
        // the widest 28-character fight-night day runs past the card at 58
        expect(size('Wednesday, December 2, 2026').fontSize).toBe(58);
        expect(size('Wednesday, December 30, 2026').fontSize).toBe(48);
        expect(size('x'.repeat(64))).toMatchObject({ fontSize: 48, whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
        const value = v => walk(cardTree({ ...card, stats: [{ label: 'L', value: v }] })).find(n => n.props?.children === v).props.style;
        expect(value('1,234').fontSize).toBe(46);
        expect(value('BADASS').fontSize).toBe(34);
        expect(value('FUTZPIMMEL').fontSize).toBe(26);
        expect(value('Tue, Oct 6, 2026')).toMatchObject({ fontSize: 22, lineClamp: 2 });
        // five tiles (the pilot card with a belt, S21) scale the type and the
        // horizontal padding by four fifths
        const padding = stats => walk(cardTree({ ...card, stats })).find(n => n.props?.style?.flex === 1).props.style.padding;
        expect(padding(card.stats.slice(0, 4))).toBe('22px 24px');
        expect(parseFloat(padding([...card.stats.slice(0, 4), { label: 'L', value: 'v' }]).split(' ')[1])).toBeCloseTo(19.2);
        const crowded = v => walk(cardTree({ ...card, stats: [...card.stats.slice(0, 4), { label: 'L', value: v }] })).find(n => n.props?.children === v).props.style;
        expect(crowded('1,234').fontSize).toBe(37);
        expect(crowded('Anarchy').fontSize).toBe(27);
        expect(crowded('Team Anarchy')).toMatchObject({ fontSize: 18, lineClamp: 2 });
        const four = walk(cardTree({ ...card, stats: card.stats.slice(0, 4) })).find(n => n.props?.children === '1').props.style;
        expect(four.fontSize).toBe(46);
        // and their labels and notes, so "COMBAT RATIO" fits its tile
        const small = parseFloat(fontSize['2xs'][0]) * 16 * 2.5;
        expect(walk(cardTree(card)).find(n => n.props?.children === 'L1').props.style.fontSize).toBeCloseTo(small * 0.9 * 0.8);
        expect(walk(cardTree(card)).find(n => n.props?.children === 'n3').props.style.fontSize).toBeCloseTo(small * 0.8 * 0.8);
    });

    it('draws an image faint behind the text only when the card has one', () => {
        expect(walk(cardTree(card)).some(n => n.type === 'img')).toBe(false);
        const img = walk(cardTree(card, 'data:image/jpeg;base64,AAAA')).find(n => n.type === 'img');
        expect(img.props).toMatchObject({ src: 'data:image/jpeg;base64,AAAA', width: 1200, height: 630 });
        expect(img.props.style.opacity).toBeLessThan(0.5);
    });
});
