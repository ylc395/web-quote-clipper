/**
     * input:
     * 
     * > That's one small step for [a] man, one giant leap for mankind.
     * > ![www.xxxx.com](:/resourceId)
     * >
     * > That's two small step for [a] man, one giant leap for mankind.  
     * > 
     * > @@ http://baidu.com xxxx yyyy RED
     * > 
     * > comment comment
     * 
     * 
     * output:
     * 
      <figure class="c-blockquote" data-start-locator="xxxx" data-end-locator="yyyy" data-color="red">
        <blockquote>
          <p>
            That's one small step for [a] man, one giant leap for mankind.  
            <img src="www.xxxx.com">
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
