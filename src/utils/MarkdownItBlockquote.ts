

    /**
     * input:
     * 
     * > That's one small step for [a] man, one giant leap for mankind.
     * >
     * > That's two small step for [a] man, one giant leap for mankind.  
     * > 
     * > @@ http://baidu.com xxxx
     * > 
     * > comment comment
     * 
     * 
     * output:
     * 
      <figure class="c-blockquote">
        <blockquote data-locator="xxxx">
          <p>
            That's one small step for [a] man, one giant leap for mankind.  
          </p>
          <p>
            That's two small step for [a] man, one giant leap for mankind.  
          </p>
        </blockquote>
        <cite class="c-cite">
          <a href="http://baidu.com">http://baidu.com</a>
        </cite>
        <p class="c-quote-comment">
          comment comment
        </p>
      </figure>
    */