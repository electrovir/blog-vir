import {VirBlog} from 'blog-vir';
import {defineElement, html} from 'element-vir';

export const MyBlog = defineElement()({
    tagName: 'my-blog',
    render() {
        return html`
            <${VirBlog}>
                <span slot=${VirBlog.slotNames['vir-blog-brand']}>My Blog</span>
            </${VirBlog}>
        `;
    },
});
